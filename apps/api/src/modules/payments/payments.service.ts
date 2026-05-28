import { BadRequestException, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateMobileMoneyPaymentDto } from './dto/create-mobile-money-payment.dto';
import { MobileMoneyCallbackDto } from './dto/mobile-money-callback.dto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { Payment } from './entities/payment.entity';
import { CinetPayMobileMoneyProvider } from './providers/cinetpay-mobile-money.provider';
import { MobileMoneyProvider } from './providers/mobile-money.provider';
import { PayDunyaMobileMoneyProvider } from './providers/paydunya-mobile-money.provider';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { PaymentsRepository } from './repositories/payments.repository';
import { PaymentWebhookHandler } from './webhooks/payment-webhook.handler';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly ordersService: OrdersService,
    private readonly stripeProvider: StripePaymentProvider,
    private readonly mobileMoneyProvider: MobileMoneyProvider,
    private readonly cinetPayProvider: CinetPayMobileMoneyProvider,
    private readonly payDunyaProvider: PayDunyaMobileMoneyProvider,
    private readonly webhookHandler: PaymentWebhookHandler,
  ) {}

  async createCheckout(userId: string, customerEmail: string, dto: CreateCheckoutDto): Promise<CheckoutSession> {
    const order = await this.ordersService.findOwnedOrder(userId, dto.orderId);
    if (!order.totalPrice || order.totalPrice < 0.5) {
      throw new BadRequestException('Order quote amount is unavailable for checkout.');
    }

    const payment = await this.paymentsRepository.createPayment({
      userId,
      orderId: order.id,
      provider: 'stripe',
      amount: order.totalPrice,
      currency: 'EUR',
    });

    const checkout = await this.stripeProvider.createCheckoutSession({
      paymentId: payment.id,
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      customerEmail,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    await this.paymentsRepository.attachProviderReference(payment.id, checkout.providerSessionId);
    return checkout;
  }

  async initiateMobileMoneyPayment(userId: string, dto: CreateMobileMoneyPaymentDto): Promise<Payment & { checkoutUrl?: string }> {
    const order = await this.ordersService.findOwnedOrder(userId, dto.orderId);
    if (!order.totalPrice || order.totalPrice < 0.5) {
      throw new BadRequestException('Order quote amount is unavailable for Mobile Money payment.');
    }

    const payment = await this.paymentsRepository.createPayment({
      userId,
      orderId: order.id,
      provider: 'mobile_money',
      amount: order.totalPrice,
      currency: 'EUR',
    });

    const providerResult = await this.mobileMoneyProvider.initiate({
      paymentId: payment.id,
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      phoneNumber: dto.phoneNumber,
      countryIso2: dto.countryIso2,
    });

    const updatedPayment = await this.paymentsRepository.attachProviderReference(payment.id, providerResult.providerReference);
    return {
      ...updatedPayment,
      checkoutUrl: providerResult.checkoutUrl,
    };
  }

  async handleStripeWebhook(signature: string | undefined, rawBody: Buffer | undefined, parsedBody: unknown) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature.');
    }

    const event = this.stripeProvider.verifyWebhook(signature, rawBody, parsedBody);
    return this.webhookHandler.handleStripeEvent(event);
  }

  async captureAuthorizedStripePaymentForOrder(orderId: string) {
    const order = await this.ordersService.findByIdForInternal(orderId);
    if (!['payment_authorized', 'supplier_review_pending'].includes(order.status)) {
      throw new BadRequestException(`Order status ${order.status} is not eligible for manual capture.`);
    }

    const payment = await this.paymentsRepository.findLatestAuthorizedByOrderId(orderId);
    if (!payment?.providerIntentId) {
      throw new BadRequestException('No authorized Stripe payment is available for capture.');
    }
    if (payment.captureBefore && payment.captureBefore.getTime() <= Date.now()) {
      await this.paymentsRepository.updateStatus(payment.id, 'expired');
      throw new BadRequestException('Stripe authorization expired before capture.');
    }

    await this.stripeProvider.capturePaymentIntent(payment.providerIntentId);
    await this.paymentsRepository.updateStatus(payment.id, 'succeeded');
    return { ok: true, paymentId: payment.id, providerIntentId: payment.providerIntentId };
  }

  async cancelAuthorizedStripePaymentForOrder(orderId: string) {
    const order = await this.ordersService.findByIdForInternal(orderId);
    if (!['awaiting_payment', 'payment_authorized', 'supplier_review_pending', 'supplier_files_rejected'].includes(order.status)) {
      throw new BadRequestException(`Order status ${order.status} is not eligible for authorization cancellation.`);
    }

    const payment = await this.paymentsRepository.findLatestAuthorizedByOrderId(orderId);
    if (!payment?.providerIntentId) {
      return { ok: true, skipped: true };
    }

    await this.stripeProvider.cancelPaymentIntent(payment.providerIntentId);
    await this.paymentsRepository.updateStatus(payment.id, 'canceled');
    return { ok: true, paymentId: payment.id, providerIntentId: payment.providerIntentId };
  }

  handleMobileMoneyCallback(dto: MobileMoneyCallbackDto) {
    return this.webhookHandler.handleMobileMoneyEvent(dto);
  }

  async handleCinetPayWebhook(body: Record<string, unknown>) {
    const event = await this.cinetPayProvider.verifyNotification(body);
    return this.webhookHandler.handleMobileMoneyEvent(event);
  }

  async handlePayDunyaWebhook(body: unknown, query: Record<string, unknown>) {
    const event = await this.payDunyaProvider.verifyNotification({ ...objectValue(body), ...query });
    return this.webhookHandler.handleMobileMoneyEvent(event);
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}
