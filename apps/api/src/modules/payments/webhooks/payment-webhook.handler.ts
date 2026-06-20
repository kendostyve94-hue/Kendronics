import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SupplierOrderService } from '../../pricing/suppliers/supplier-order.service';
import { OrdersService } from '../../orders/orders.service';
import { EmailNotificationService } from '../../support/email-notification.service';
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
    private readonly emailNotificationService: EmailNotificationService,
    private readonly prisma: PrismaService,
    private readonly supplierOrderService: SupplierOrderService,
  ) {}

  async handleStripeEvent(event: VerifiedStripePaymentEvent) {
    if (event.marketplacePurchaseId) {
      return this.handleMarketplaceStripeEvent(event);
    }

    const payment = await this.findStripePayment(event);
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

    if (event.providerIntentId && payment.providerIntentId !== event.providerIntentId) {
      await this.paymentsRepository.attachProviderIntent(payment.id, event.providerIntentId, event.captureBefore);
    }

    if (event.paymentStatus === 'authorized') {
      await this.paymentsRepository.updateStatus(payment.id, 'authorized', {
        providerIntentId: event.providerIntentId,
        captureBefore: event.captureBefore,
      });
      await this.ordersService.markPaymentAuthorizedFromVerifiedPayment(payment.orderId);
      await this.notificationsService.create({
        userId: payment.userId,
        type: 'payment.authorized',
        title: 'Paiement autorise',
        body: `Votre paiement de ${payment.amount.toFixed(2)} ${payment.currency} est autorise. Les fichiers passent en controle technique avant encaissement.`,
      });
      await this.sendWorkflowEmail(payment.userId, payment.orderId, 'order_authorized_received');
      await this.trackingService.addAdminStatusEvent(
        payment.orderId,
        'payment_authorized',
        'Paiement autorise par Stripe. La verification des fichiers peut demarrer avant la capture.',
      );
      const supplierReview = await this.supplierOrderService.sendTechnicalReviewPackage(payment.orderId);
      await this.trackingService.addAdminStatusEvent(
        payment.orderId,
        'supplier_review_pending',
        `Paquet technique transmis au reseau de fabrication (${supplierReview.status}).`,
      );
    }

    if (event.paymentStatus === 'succeeded') {
      await this.paymentsRepository.updateStatus(payment.id, 'succeeded');
      await this.ordersService.markPaidFromVerifiedPayment(payment.orderId);
      await this.notificationsService.create({
        userId: payment.userId,
        type: 'payment.succeeded',
        title: 'Paiement capture',
        body: `Votre paiement de ${payment.amount.toFixed(2)} ${payment.currency} a ete capture apres acceptation technique des fichiers.`,
      });
      await this.sendWorkflowEmail(payment.userId, payment.orderId, 'supplier_approved_payment_captured');
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
      await this.sendWorkflowEmail(payment.userId, payment.orderId, 'order_cancelled_authorization_released');
    }

    if (event.paymentStatus === 'canceled' || event.paymentStatus === 'expired') {
      await this.paymentsRepository.updateStatus(payment.id, event.paymentStatus);
      await this.ordersService.cancelAfterPaymentAuthorizationReleased(payment.orderId);
      await this.notificationsService.create({
        userId: payment.userId,
        type: `payment.${event.paymentStatus}`,
        title: event.paymentStatus === 'expired' ? 'Autorisation expiree' : 'Autorisation annulee',
        body: 'Votre autorisation de paiement Stripe a ete liberee. Aucun montant n a ete encaisse.',
      });
    }

    await this.paymentsRepository.markEventProcessed('stripe', event.id);
    return { received: true, duplicate: false };
  }

  private async handleMarketplaceStripeEvent(event: VerifiedStripePaymentEvent) {
    const purchase = await this.prisma.projectPurchase.findUnique({
      where: { id: event.marketplacePurchaseId },
      include: { project: true },
    });
    const { duplicate } = await this.paymentsRepository.recordWebhookEvent({
      provider: 'stripe',
      providerEventId: event.id,
      eventType: event.type,
      payload: event.raw,
    });

    if (duplicate) {
      return { received: true, duplicate: true };
    }

    if (event.paymentStatus === 'ignored') {
      await this.paymentsRepository.markEventProcessed('stripe', event.id);
      return { received: true, duplicate: false, ignored: true };
    }

    if (!purchase) {
      await this.paymentsRepository.markEventProcessed(
        'stripe',
        event.id,
        'No marketplace purchase matched the Stripe event.',
      );
      throw new NotFoundException('Marketplace purchase not found for Stripe event.');
    }

    if (event.providerPaymentId || event.providerIntentId) {
      await this.prisma.projectPurchase.update({
        where: { id: purchase.id },
        data: {
          provider: 'stripe',
          providerSessionId: event.type.startsWith('checkout.session') ? event.providerPaymentId : purchase.providerSessionId,
          providerPaymentId: event.providerIntentId ?? event.providerPaymentId,
        },
      });
    }

    if (event.paymentStatus === 'succeeded') {
      const updatedPurchase = await this.prisma.$transaction(async (tx) => {
        const paidPurchase = await tx.projectPurchase.update({
          where: { id: purchase.id },
          data: {
            status: 'paid',
            paidAt: purchase.paidAt ?? new Date(),
            provider: 'stripe',
            providerPaymentId: event.providerIntentId ?? event.providerPaymentId,
          },
        });
        await tx.projectLicenseGrant.upsert({
          where: { projectId_userId: { projectId: purchase.projectId, userId: purchase.buyerId } },
          create: {
            projectId: purchase.projectId,
            userId: purchase.buyerId,
            purchaseId: purchase.id,
            status: 'active',
            licenseCode: purchase.project.licenseCode,
            allowedUses: purchase.project.allowedUses,
            source: 'purchase',
            metadata: {
              provider: 'stripe',
              providerEventId: event.id,
              providerPaymentId: event.providerPaymentId,
              providerIntentId: event.providerIntentId,
            },
          },
          update: {
            status: 'active',
            purchaseId: purchase.id,
            licenseCode: purchase.project.licenseCode,
            allowedUses: purchase.project.allowedUses,
            revokedAt: null,
            metadata: {
              provider: 'stripe',
              providerEventId: event.id,
              providerPaymentId: event.providerPaymentId,
              providerIntentId: event.providerIntentId,
            },
          },
        });
        return paidPurchase;
      });

      await this.notificationsService.create({
        userId: updatedPurchase.buyerId,
        type: 'project.license.granted',
        title: 'Licence de projet activee',
        body: `Votre licence pour ${purchase.project.title} est maintenant active.`,
      });
    }

    if (event.paymentStatus === 'failed') {
      await this.prisma.projectPurchase.update({
        where: { id: purchase.id },
        data: { status: 'failed' },
      });
      await this.notificationsService.create({
        userId: purchase.buyerId,
        type: 'project.purchase.failed',
        title: 'Paiement marketplace non confirme',
        body: `Le paiement pour ${purchase.project.title} n a pas pu etre confirme.`,
      });
    }

    if (event.paymentStatus === 'canceled' || event.paymentStatus === 'expired') {
      await this.prisma.projectPurchase.update({
        where: { id: purchase.id },
        data: {
          status: event.paymentStatus,
          canceledAt: new Date(),
        },
      });
    }

    await this.paymentsRepository.markEventProcessed('stripe', event.id);
    return { received: true, duplicate: false, marketplace: true };
  }

  private async sendWorkflowEmail(userId: string, orderId: string, template: Parameters<EmailNotificationService['sendOrderWorkflowEmail']>[0]['template']) {
    const [user, order] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
      this.prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } }),
    ]);
    if (!user?.email || !order?.orderNumber) return;
    await this.emailNotificationService.sendOrderWorkflowEmail({ to: user.email, template, orderNumber: order.orderNumber });
  }

  private async findStripePayment(event: VerifiedStripePaymentEvent) {
    if (event.localPaymentId) {
      const byId = await this.paymentsRepository.findById(event.localPaymentId);
      if (byId) return byId;
    }

    if (event.providerIntentId) {
      const byIntent = await this.paymentsRepository.findByProviderIntent('stripe', event.providerIntentId);
      if (byIntent) return byIntent;
    }

    return this.paymentsRepository.findByProviderReference('stripe', event.providerPaymentId);
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
