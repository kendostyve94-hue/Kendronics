import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';
import { OrdersService } from '../../orders/orders.service';
import { TrackingService } from '../../tracking/tracking.service';
import { MobileMoneyCallbackDto } from '../dto/mobile-money-callback.dto';
import { PaymentsRepository } from '../repositories/payments.repository';
import { VerifiedStripePaymentEvent } from '../providers/payment-provider.types';

@Injectable()
export class PaymentWebhookHandler {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly ordersService: OrdersService,
    private readonly trackingService: TrackingService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleStripeEvent(event: VerifiedStripePaymentEvent) {
    const payment = await this.paymentsRepository.findByProviderReference('stripe', event.providerPaymentId);
    const { duplicate } = await this.paymentsRepository.recordWebhookEvent({
      provider: 'stripe',
      providerEventId: event.id,
      eventType: event.type,
      payload: event.raw,
      paymentId: payment?.id,
    });

    if (duplicate) {
      return { received: true, duplicate: true };
    }

    if (event.paymentStatus === 'ignored') {
      await this.paymentsRepository.markEventProcessed('stripe', event.id);
      return { received: true, duplicate: false, ignored: true };
    }

    if (!payment) {
      await this.paymentsRepository.markEventProcessed(
        'stripe',
        event.id,
        'No local payment matched the provider reference.',
      );
      throw new NotFoundException('Payment not found for Stripe event.');
    }

    if (event.paymentStatus === 'succeeded') {
      await this.paymentsRepository.updateStatus(payment.id, 'succeeded');
      await this.ordersService.markPaidFromVerifiedPayment(payment.orderId);
      await this.notificationsService.create({
        userId: payment.userId,
        type: 'payment.succeeded',
        title: 'Paiement confirme',
        body: `Votre paiement de ${payment.amount.toFixed(2)} ${payment.currency} a ete confirme.`,
      });
      await this.trackingService.addAdminStatusEvent(
        payment.orderId,
        'paid',
        'Payment confirmed by Stripe.',
      );
    }

    if (event.paymentStatus === 'failed') {
      await this.paymentsRepository.updateStatus(payment.id, 'failed');
      await this.notificationsService.create({
        userId: payment.userId,
        type: 'payment.failed',
        title: 'Paiement non confirme',
        body: 'Le paiement de votre commande n’a pas pu etre confirme. Vous pouvez reessayer ou contacter le support.',
      });
    }

    await this.paymentsRepository.markEventProcessed('stripe', event.id);
    return { received: true, duplicate: false };
  }

  async handleMobileMoneyEvent(event: MobileMoneyCallbackDto) {
    const payment = await this.paymentsRepository.findByProviderReference(
      'mobile_money',
      event.providerReference,
    );
    const { duplicate } = await this.paymentsRepository.recordWebhookEvent({
      provider: 'mobile_money',
      providerEventId: event.providerEventId,
      eventType: `mobile_money.${event.status}`,
      payload: event,
      paymentId: payment?.id,
    });

    if (duplicate) {
      return { received: true, duplicate: true };
    }

    if (!payment) {
      await this.paymentsRepository.markEventProcessed(
        'mobile_money',
        event.providerEventId,
        'No local payment matched the provider reference.',
      );
      throw new NotFoundException('Payment not found for Mobile Money event.');
    }

    if (event.status === 'confirmed') {
      await this.paymentsRepository.updateStatus(payment.id, 'succeeded');
      await this.ordersService.markPaidFromVerifiedPayment(payment.orderId);
      await this.notificationsService.create({
        userId: payment.userId,
        type: 'payment.succeeded',
        title: 'Paiement confirme',
        body: `Votre paiement Mobile Money de ${payment.amount.toFixed(2)} ${payment.currency} a ete confirme.`,
      });
      await this.trackingService.addAdminStatusEvent(
        payment.orderId,
        'paid',
        'Payment confirmed by Mobile Money provider.',
      );
    }

    if (event.status === 'failed') {
      await this.paymentsRepository.updateStatus(payment.id, 'failed');
      await this.notificationsService.create({
        userId: payment.userId,
        type: 'payment.failed',
        title: 'Paiement non confirme',
        body: 'Le paiement Mobile Money de votre commande n’a pas pu etre confirme.',
      });
    }

    await this.paymentsRepository.markEventProcessed('mobile_money', event.providerEventId);
    return { received: true, duplicate: false };
  }
}
