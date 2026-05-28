import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Payment, PaymentEvent, PaymentProvider, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(input: {
    userId: string;
    orderId: string;
    provider: PaymentProvider;
    amount: number;
    currency: 'EUR';
  }): Promise<Payment> {
    const payment = await this.prisma.payment.create({
      data: {
        userId: input.userId,
        orderId: input.orderId,
        provider: input.provider,
        amount: input.amount,
        currency: input.currency,
        status: 'pending',
      },
    });

    return this.toPayment(payment);
  }

  async attachProviderReference(paymentId: string, providerPaymentId: string): Promise<Payment> {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { providerPaymentId },
    });
    return this.toPayment(payment);
  }

  async attachProviderIntent(paymentId: string, providerIntentId: string, captureBefore?: Date): Promise<Payment> {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { providerIntentId, captureBefore },
    });
    return this.toPayment(payment);
  }

  async findById(id: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    return payment ? this.toPayment(payment) : null;
  }

  async findByProviderReference(provider: PaymentProvider, providerPaymentId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { provider, providerPaymentId },
    });
    return payment ? this.toPayment(payment) : null;
  }

  async findByProviderIntent(provider: PaymentProvider, providerIntentId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { provider, providerIntentId },
    });
    return payment ? this.toPayment(payment) : null;
  }

  async findLatestAuthorizedByOrderId(orderId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, provider: 'stripe', status: 'authorized', providerIntentId: { not: null } },
      orderBy: { authorizedAt: 'desc' },
    });
    return payment ? this.toPayment(payment) : null;
  }

  async findAuthorizedCaptureBefore(cutoff: Date): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        provider: 'stripe',
        status: 'authorized',
        providerIntentId: { not: null },
        captureBefore: { lte: cutoff },
      },
      orderBy: { captureBefore: 'asc' },
    });
    return payments.map((payment) => this.toPayment(payment));
  }

  async updateStatus(paymentId: string, status: PaymentStatus, input: { providerIntentId?: string; captureBefore?: Date } = {}): Promise<Payment> {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        providerIntentId: input.providerIntentId,
        captureBefore: input.captureBefore,
        authorizedAt: status === 'authorized' ? new Date() : undefined,
        succeededAt: status === 'succeeded' ? new Date() : undefined,
        failedAt: status === 'failed' ? new Date() : undefined,
        canceledAt: status === 'canceled' || status === 'expired' ? new Date() : undefined,
      },
    });

    return this.toPayment(payment);
  }

  async recordWebhookEvent(input: {
    provider: PaymentProvider;
    providerEventId: string;
    eventType: string;
    payload: unknown;
    paymentId?: string;
  }): Promise<{ event: PaymentEvent; duplicate: boolean }> {
    const existing = await this.prisma.paymentEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: input.provider,
          providerEventId: input.providerEventId,
        },
      },
    });

    if (existing) {
      return { event: this.toPaymentEvent(existing), duplicate: true };
    }

    const event = await this.prisma.paymentEvent.create({
      data: {
        paymentId: input.paymentId,
        provider: input.provider,
        providerEventId: input.providerEventId,
        eventType: input.eventType,
        payload: sanitizePaymentPayload(input.payload) as Prisma.InputJsonValue,
      },
    });

    return { event: this.toPaymentEvent(event), duplicate: false };
  }

  async markEventProcessed(provider: PaymentProvider, providerEventId: string, error?: string): Promise<void> {
    await this.prisma.paymentEvent.updateMany({
      where: { provider, providerEventId },
      data: {
        processedAt: new Date(),
        processingError: error,
      },
    });
  }

  private toPayment(payment: {
    id: string;
    orderId: string;
    userId: string;
    provider: string;
    providerPaymentId: string | null;
    providerIntentId: string | null;
    status: string;
    amount: Prisma.Decimal;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    authorizedAt: Date | null;
    captureBefore: Date | null;
    succeededAt: Date | null;
    failedAt: Date | null;
    canceledAt: Date | null;
  }): Payment {
    return {
      id: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      provider: payment.provider as PaymentProvider,
      providerPaymentId: payment.providerPaymentId ?? undefined,
      providerIntentId: payment.providerIntentId ?? undefined,
      status: payment.status as PaymentStatus,
      amount: payment.amount.toNumber(),
      currency: payment.currency as 'EUR',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      authorizedAt: payment.authorizedAt ?? undefined,
      captureBefore: payment.captureBefore ?? undefined,
      succeededAt: payment.succeededAt ?? undefined,
      failedAt: payment.failedAt ?? undefined,
      canceledAt: payment.canceledAt ?? undefined,
    };
  }

  private toPaymentEvent(event: {
    id: string;
    paymentId: string | null;
    provider: string;
    providerEventId: string;
    eventType: string;
    payload: Prisma.JsonValue;
    processedAt: Date | null;
    processingError: string | null;
    createdAt: Date;
  }): PaymentEvent {
    return {
      id: event.id,
      paymentId: event.paymentId ?? undefined,
      provider: event.provider as PaymentProvider,
      providerEventId: event.providerEventId,
      eventType: event.eventType,
      payload: event.payload,
      processedAt: event.processedAt ?? undefined,
      processingError: event.processingError ?? undefined,
      createdAt: event.createdAt,
    };
  }
}

function sanitizePaymentPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload.map(sanitizePaymentPayload);
  }
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const sensitiveKeys = new Set([
    'billing_details',
    'card',
    'customer_details',
    'customer_email',
    'customer_name',
    'customer_phone',
    'email',
    'phone',
    'receipt_email',
    'shipping',
  ]);

  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveKeys.has(key) ? '[redacted]' : sanitizePaymentPayload(value),
    ]),
  );
}
