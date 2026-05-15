import { BadRequestException, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateMobileMoneyPaymentDto } from './dto/create-mobile-money-payment.dto';
import { MobileMoneyCallbackDto } from './dto/mobile-money-callback.dto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { Payment } from './entities/payment.entity';
import { MobileMoneyProvider } from './providers/mobile-money.provider';
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

  async initiateMobileMoneyPayment(userId: string, dto: CreateMobileMoneyPaymentDto): Promise<Payment> {
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

    return this.paymentsRepository.attachProviderReference(payment.id, providerResult.providerReference);
  }

  async handleStripeWebhook(signature: string | undefined, rawBody: Buffer | undefined, parsedBody: unknown) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature.');
    }

    const event = this.stripeProvider.verifyWebhook(signature, rawBody, parsedBody);
    return this.webhookHandler.handleStripeEvent(event);
  }

  handleMobileMoneyCallback(dto: MobileMoneyCallbackDto) {
    return this.webhookHandler.handleMobileMoneyEvent(dto);
  }
}
