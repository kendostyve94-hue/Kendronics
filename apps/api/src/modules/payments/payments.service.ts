import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { SupplierOrderService } from '../pricing/suppliers/supplier-order.service';
import { EmailNotificationService } from '../support/email-notification.service';
import { TrackingService } from '../tracking/tracking.service';
import { VerificationLevelService } from '../users/verification-level.service';
import { AuthorizePaypalOrderDto } from './dto/authorize-paypal-order.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateProjectCheckoutDto } from './dto/create-project-checkout.dto';
import { CreateMobileMoneyPaymentDto } from './dto/create-mobile-money-payment.dto';
import { CreatePaypalOrderDto } from './dto/create-paypal-order.dto';
import { MobileMoneyCallbackDto } from './dto/mobile-money-callback.dto';
import { ReuploadCorrectedFilesDto, SupplierReviewResultDto } from './dto/order-workflow.dto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { Payment } from './entities/payment.entity';
import { CinetPayMobileMoneyProvider } from './providers/cinetpay-mobile-money.provider';
import { MobileMoneyProvider } from './providers/mobile-money.provider';
import { PayDunyaMobileMoneyProvider } from './providers/paydunya-mobile-money.provider';
import { PaypalPaymentProvider } from './providers/paypal-payment.provider';
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
    private readonly paypalProvider: PaypalPaymentProvider,
    private readonly webhookHandler: PaymentWebhookHandler,
    private readonly notificationsService: NotificationsService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly prisma: PrismaService,
    private readonly verificationLevelService: VerificationLevelService,
    private readonly trackingService: TrackingService,
    private readonly supplierOrderService: SupplierOrderService,
  ) {}

  async createCheckout(userId: string, customerEmail: string, dto: CreateCheckoutDto): Promise<CheckoutSession> {
    const order = await this.ordersService.findOwnedOrder(userId, dto.orderId);
    if (!order.totalPrice || order.totalPrice < 0.5) {
      throw new BadRequestException('Order quote amount is unavailable for checkout.');
    }
    const verification = await this.verificationLevelService.evaluateOrder(userId, order.totalPrice);
    if (!verification.allowed) {
      throw new BadRequestException({
        message: 'Verification required before payment authorization.',
        allowed: false,
        required_verification_level: verification.requiredVerificationLevel,
        missing_steps: verification.missingSteps,
        risk_score: verification.riskScore,
      });
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

  async createProjectCheckout(userId: string, customerEmail: string, dto: CreateProjectCheckoutDto): Promise<CheckoutSession> {
    const purchase = await this.prisma.projectPurchase.findUnique({
      where: { id: dto.purchaseId },
      include: { project: true },
    });
    if (!purchase || purchase.buyerId !== userId) {
      throw new BadRequestException('Marketplace purchase is not attached to this account.');
    }
    if (purchase.status !== 'pending') {
      throw new BadRequestException(`Marketplace purchase status ${purchase.status} cannot start checkout.`);
    }
    if (purchase.project.status !== 'published' || purchase.project.projectType !== 'paid') {
      throw new BadRequestException('This project is not available for marketplace checkout.');
    }

    const checkout = await this.stripeProvider.createProjectCheckoutSession({
      purchaseId: purchase.id,
      projectId: purchase.projectId,
      buyerId: purchase.buyerId,
      title: purchase.project.title,
      amountCents: purchase.amountCents,
      currency: purchase.currency,
      customerEmail,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    await this.prisma.projectPurchase.update({
      where: { id: purchase.id },
      data: {
        provider: 'stripe',
        providerSessionId: checkout.providerSessionId,
      },
    });

    return checkout;
  }

  async initiateMobileMoneyPayment(userId: string, dto: CreateMobileMoneyPaymentDto): Promise<Payment & { checkoutUrl?: string }> {
    const order = await this.ordersService.findOwnedOrder(userId, dto.orderId);
    if (!order.totalPrice || order.totalPrice < 0.5) {
      throw new BadRequestException('Order quote amount is unavailable for Mobile Money payment.');
    }
    const verification = await this.verificationLevelService.evaluateOrder(userId, order.totalPrice);
    if (!verification.allowed) {
      throw new BadRequestException({
        message: 'Verification required before payment authorization.',
        allowed: false,
        required_verification_level: verification.requiredVerificationLevel,
        missing_steps: verification.missingSteps,
        risk_score: verification.riskScore,
      });
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

  async createPaypalOrder(userId: string, dto: CreatePaypalOrderDto): Promise<CheckoutSession> {
    const order = await this.ordersService.findOwnedOrder(userId, dto.orderId);
    if (!order.totalPrice || order.totalPrice < 0.5) {
      throw new BadRequestException('Order quote amount is unavailable for PayPal payment.');
    }
    const verification = await this.verificationLevelService.evaluateOrder(userId, order.totalPrice);
    if (!verification.allowed) {
      throw new BadRequestException({
        message: 'Verification required before payment authorization.',
        allowed: false,
        required_verification_level: verification.requiredVerificationLevel,
        missing_steps: verification.missingSteps,
        risk_score: verification.riskScore,
      });
    }

    const payment = await this.paymentsRepository.createPayment({
      userId,
      orderId: order.id,
      provider: 'paypal',
      amount: order.totalPrice,
      currency: 'EUR',
    });

    const checkout = await this.paypalProvider.createOrder({
      paymentId: payment.id,
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
    });

    await this.paymentsRepository.attachProviderReference(payment.id, checkout.providerSessionId);
    return checkout;
  }

  async authorizePaypalOrder(userId: string, dto: AuthorizePaypalOrderDto): Promise<Payment> {
    const payment = await this.paymentsRepository.findByProviderReference('paypal', dto.paypalOrderId);
    if (!payment || payment.userId !== userId) {
      throw new BadRequestException('PayPal order is not attached to this account.');
    }
    if (payment.status === 'authorized') {
      return payment;
    }
    if (payment.status !== 'pending') {
      throw new BadRequestException(`PayPal payment status ${payment.status} cannot be authorized.`);
    }

    const authorization = await this.paypalProvider.authorizeOrder(dto.paypalOrderId);
    const authorizedPayment = await this.paymentsRepository.updateStatus(payment.id, 'authorized', {
      providerIntentId: authorization.authorizationId,
      captureBefore: authorization.captureBefore,
    });
    await this.ordersService.markPaymentAuthorizedFromVerifiedPayment(payment.orderId);
    await this.notificationsService.create({
      userId: payment.userId,
      type: 'payment.authorized',
      title: 'Paiement autorise',
      body: `Votre paiement PayPal de ${payment.amount.toFixed(2)} ${payment.currency} est autorise. Les fichiers passent en controle technique avant encaissement.`,
    });
    const order = await this.ordersService.findByIdForInternal(payment.orderId);
    await this.sendWorkflowEmail(payment.userId, order.orderNumber, 'order_authorized_received');
    await this.trackingService.addAdminStatusEvent(
      payment.orderId,
      'payment_authorized',
      'Paiement autorise par PayPal. La verification des fichiers peut demarrer avant la capture.',
    );
    const supplierReview = await this.supplierOrderService.sendTechnicalReviewPackage(payment.orderId);
    await this.trackingService.addAdminStatusEvent(
      payment.orderId,
      'supplier_review_pending',
      `Paquet technique transmis au reseau de fabrication (${supplierReview.status}).`,
    );
    return authorizedPayment;
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

    if (payment.provider === 'paypal') {
      await this.paypalProvider.captureAuthorization(payment.providerIntentId);
    } else {
      await this.stripeProvider.capturePaymentIntent(payment.providerIntentId);
    }
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

    if (payment.provider === 'paypal') {
      await this.paypalProvider.cancelAuthorization(payment.providerIntentId);
    } else {
      await this.stripeProvider.cancelPaymentIntent(payment.providerIntentId);
    }
    await this.paymentsRepository.updateStatus(payment.id, 'canceled');
    return { ok: true, paymentId: payment.id, providerIntentId: payment.providerIntentId };
  }

  async cancelAfterFirstRejection(userId: string, orderId: string) {
    const order = await this.ordersService.findOwnedOrder(userId, orderId);
    if (order.status !== 'supplier_files_rejected') {
      throw new BadRequestException('Only orders waiting after first technical rejection can be cancelled here.');
    }

    await this.cancelAuthorizedStripePaymentForOrder(orderId);
    await this.ordersService.updateStatusFromAdmin(orderId, { status: 'cancelled', note: 'Customer cancelled after first technical rejection.' });
    await this.prisma.order.update({
      where: { id: orderId },
      data: { customerDecisionAfterRejection: 'cancel', supplierReviewStatus: 'cancelled' },
    });
    await this.notificationsService.create({
      userId,
      type: 'order.authorization_released',
      title: 'Autorisation annulee',
      body: 'Votre commande a ete annulee et l autorisation de paiement a ete liberee.',
    });
    await this.sendWorkflowEmail(userId, order.orderNumber, 'order_cancelled_authorization_released');
    return { ok: true, orderId };
  }

  async reuploadCorrectedFiles(userId: string, orderId: string, dto: ReuploadCorrectedFilesDto) {
    const order = await this.ordersService.findOwnedOrder(userId, orderId);
    if (order.status !== 'supplier_files_rejected') {
      throw new BadRequestException('Corrected files can only be uploaded after a technical rejection.');
    }

    const payment = await this.paymentsRepository.findLatestAuthorizedByOrderId(orderId);
    if (!payment?.providerIntentId) {
      throw new BadRequestException('No active authorization is available for this order.');
    }
    if (payment.captureBefore && payment.captureBefore.getTime() <= Date.now()) {
      await this.paymentsRepository.updateStatus(payment.id, 'expired');
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'awaiting_payment', supplierReviewStatus: 'authorization_expired' } });
      throw new BadRequestException('Payment authorization expired. The customer must re-authorize before review.');
    }

    const rawOrder = await this.prisma.order.findUnique({ where: { id: orderId }, include: { quote: true } });
    if (!rawOrder?.quote) throw new BadRequestException('Order quote is unavailable.');

    const nextVersion = rawOrder.currentFileVersion + 1;
    const files = [
      { fileType: 'gerber', uploadId: dto.gerberFileId || rawOrder.quote.gerberFileId },
      { fileType: 'bom', uploadId: dto.bomFileId || rawOrder.quote.bomFileId },
      { fileType: 'cpl', uploadId: dto.cplFileId || rawOrder.quote.cplFileId },
    ].filter((file): file is { fileType: string; uploadId: string } => Boolean(file.uploadId));

    await this.prisma.$transaction([
      this.prisma.orderFile.updateMany({ where: { orderId }, data: { isCurrentVersion: false } }),
      this.prisma.technicalSpecFile.updateMany({ where: { orderId }, data: { isCurrentVersion: false } }),
      ...files.map((file) =>
        this.prisma.orderFile.create({
          data: { orderId, fileType: file.fileType, uploadId: file.uploadId, fileVersion: nextVersion, isCurrentVersion: true },
        }),
      ),
      this.prisma.technicalSpecFile.create({
        data: {
          orderId,
          fileVersion: nextVersion,
          isCurrentVersion: true,
          payload: {
            orderNumber: rawOrder.orderNumber,
            productType: rawOrder.quote.productType,
            layers: rawOrder.quote.layers,
            lengthMm: rawOrder.quote.lengthMm.toNumber(),
            widthMm: rawOrder.quote.widthMm.toNumber(),
            quantity: rawOrder.quote.quantity,
            configSnapshot: rawOrder.quote.configSnapshot,
            correctedUpload: dto as Prisma.InputJsonValue,
          },
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'supplier_review_pending',
          supplierReviewStatus: 'sent',
          customerDecisionAfterRejection: 'reupload',
          currentFileVersion: nextVersion,
          reviewAttemptCount: Math.max(rawOrder.reviewAttemptCount + 1, 2),
        },
      }),
      this.prisma.supplierReview.create({
        data: {
          orderId,
          attemptNumber: 2,
          supplier: 'manufacturing_network',
          supplierStatus: 'under_review',
          technicalPackageVersion: nextVersion,
          externalReviewId: `reupload-${orderId}-${nextVersion}`,
        },
      }),
    ]);

    await this.notificationsService.create({
      userId,
      type: 'order.corrected_files_received',
      title: 'Fichiers corriges recus',
      body: 'Vos fichiers corriges sont repartis en controle technique.',
    });
    return this.ordersService.findOwnedOrder(userId, orderId);
  }

  async recordSupplierReviewResult(orderId: string, dto: SupplierReviewResultDto) {
    const order = await this.ordersService.findByIdForInternal(orderId);
    if (!['payment_authorized', 'supplier_review_pending'].includes(order.status)) {
      throw new BadRequestException(`Order status ${order.status} cannot receive a technical review result.`);
    }

    const rawOrder = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!rawOrder) throw new BadRequestException('Order not found.');

    const attemptNumber = Math.max(rawOrder.reviewAttemptCount || 1, 1);
    const supplier = dto.supplier?.trim() || 'manufacturing_network';
    const externalReviewId = dto.externalReviewId?.trim() || `manual-${orderId}-${attemptNumber}-${dto.status}`;

    await this.prisma.supplierReview.upsert({
      where: {
        orderId_attemptNumber_supplier_externalReviewId: {
          orderId,
          attemptNumber,
          supplier,
          externalReviewId,
        },
      },
      create: {
        orderId,
        attemptNumber,
        supplier,
        supplierStatus: dto.status,
        supplierFeedback: dto.feedback,
        technicalPackageVersion: rawOrder.currentFileVersion,
        externalReviewId,
        reviewedAt: new Date(),
      },
      update: {
        supplierStatus: dto.status,
        supplierFeedback: dto.feedback,
        reviewedAt: new Date(),
      },
    });

    if (dto.status === 'approved') {
      await this.captureAuthorizedStripePaymentForOrder(orderId);
      const updatedOrder = await this.ordersService.updateStatusFromAdmin(orderId, { status: 'paid', note: 'Technical review approved; payment captured.' });
      await this.createPostCaptureRecords(orderId, order.userId);
      return updatedOrder;
    }

    if (attemptNumber >= (rawOrder.maxReviewAttempts || 2)) {
      await this.cancelAuthorizedStripePaymentForOrder(orderId);
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          supplierReviewStatus: 'rejected_final',
          supplierFeedback: dto.feedback,
          customerDecisionAfterRejection: 'auto_cancel_after_second_rejection',
        },
      });
    await this.notificationsService.create({
      userId: order.userId,
      type: 'order.rejected_final',
        title: 'Commande annulee',
      body: 'Les fichiers ont ete refuses une seconde fois. L autorisation de paiement a ete annulee automatiquement.',
    });
      await this.sendWorkflowEmail(order.userId, order.orderNumber, 'supplier_rejected_second_attempt', dto.feedback);
      return this.ordersService.findByIdForInternal(orderId);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'supplier_files_rejected',
        supplierReviewStatus: 'rejected',
        supplierFeedback: dto.feedback,
        reviewAttemptCount: attemptNumber,
        customerDecisionAfterRejection: null,
      },
    });
    await this.notificationsService.create({
      userId: order.userId,
      type: 'order.files_rejected',
      title: 'Correction requise',
      body: 'Vos fichiers necessitent une correction. Vous pouvez annuler la commande ou envoyer une version corrigee.',
    });
    await this.sendWorkflowEmail(order.userId, order.orderNumber, 'supplier_rejected_first_attempt', dto.feedback);
    return this.ordersService.findByIdForInternal(orderId);
  }

  private async createPostCaptureRecords(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        quote: { include: { pricingSnapshot: true } },
        user: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!order?.quote) return;
    const amount = order.quote.finalTotal;
    const payment = order.payments[0];
    const customerName = order.user.fullName || order.user.companyName || order.user.email;
    const pcbSpecs = `${order.quote.productType}, ${order.quote.layers} couches, ${order.quote.lengthMm.toNumber()} x ${order.quote.widthMm.toNumber()} mm, ${order.quote.quantity} pcs`;
    const internalReference = `KPR-${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || order.id.slice(0, 8)}`;

    await this.prisma.$transaction([
      this.prisma.financeRecord.create({
        data: { orderId, type: 'ORDER_REVENUE_CAPTURED', amount, currency: order.quote.currency, status: 'recorded' },
      }),
      this.prisma.invoice.upsert({
        where: { invoiceNumber: `INV-${order.orderNumber}` },
        create: { orderId, invoiceNumber: `INV-${order.orderNumber}`, status: 'issued' },
        update: { status: 'issued', issuedAt: new Date() },
      }),
      this.prisma.productionJob.upsert({
        where: { internalReference },
        create: { orderId, internalReference, status: 'created', startedAt: new Date() },
        update: { status: 'created', startedAt: new Date() },
      }),
      this.prisma.mondaySyncLog.createMany({
        data: [
          {
            orderId,
            board: 'COMMANDES',
            operation: 'payment_captured',
            sourceEventId: `capture-${orderId}`,
            status: 'pending',
            payload: {
              orderNumber: order.orderNumber,
              customerName,
              customerEmail: order.user.email,
              destinationCountry: order.destinationCountryIso2,
              quoteId: order.quoteId,
              paymentStatus: 'Capture',
              orderStatus: 'Paiement capture',
              supplierReviewStatus: order.supplierReviewStatus,
              supplierOrderId: order.externalSupplierOrderId,
              supplier: order.externalManufacturingPartner,
              pcbSpecs,
            } as Prisma.InputJsonValue,
          },
          {
            orderId,
            board: 'EN_PRODUCTION',
            operation: 'production_job_created',
            sourceEventId: `production-${orderId}`,
            status: 'pending',
            payload: {
              internalReference,
              orderNumber: order.orderNumber,
              customerName,
              supplier: order.externalManufacturingPartner,
              fabricationType: order.quote.productType,
              destinationCountry: order.destinationCountryIso2,
              productionStatus: 'A demarrer',
              pcbFabricationStatus: 'En attente',
              pcbQcStatus: 'En attente',
              smtStatus: 'Non requis',
              assemblyRequired: false,
              supplierOrderId: order.externalSupplierOrderId,
            } as Prisma.InputJsonValue,
          },
          {
            orderId,
            board: 'CHIFFRE_AFFAIRE_LIVE',
            operation: 'finance_capture_recorded',
            sourceEventId: `finance-${orderId}`,
            status: 'pending',
            payload: {
              orderNumber: order.orderNumber,
              quoteId: order.quoteId,
              customerName,
              customerCompany: order.user.companyName,
              destinationCountry: order.destinationCountryIso2,
              currency: order.quote.currency,
              paymentStatus: 'Capture',
              quoteStatus: 'Commande payee',
              totalEstimatedPrice: amount.toNumber(),
              customerPaidAmount: amount.toNumber(),
              supplierEstimatedCost: order.quote.pricingSnapshot?.supplierEstimatedPrice.toNumber(),
              logisticsEstimatedCost: order.quote.pricingSnapshot?.shippingPrice.toNumber(),
              stripePaymentIntentId: payment?.providerIntentId,
              paymentMethod: payment?.provider,
              paymentDate: new Date().toISOString(),
              invoiceNumber: `INV-${order.orderNumber}`,
            } as Prisma.InputJsonValue,
          },
        ],
        skipDuplicates: true,
      }),
    ]);

    await this.notificationsService.create({
      userId,
      type: 'payment.captured.production_started',
      title: 'Paiement confirme',
      body: 'Vos fichiers sont acceptes, le paiement est capture et la production demarre.',
    });
    await this.sendWorkflowEmail(userId, order.orderNumber, 'supplier_approved_payment_captured');
  }

  private async sendWorkflowEmail(
    userId: string,
    orderNumber: string,
    template: Parameters<EmailNotificationService['sendOrderWorkflowEmail']>[0]['template'],
    feedback?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return;
    await this.emailNotificationService.sendOrderWorkflowEmail({ to: user.email, template, orderNumber, feedback });
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
