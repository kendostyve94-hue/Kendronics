import { Injectable } from '@nestjs/common';
import { Payment, PaymentEvent, PaymentProvider, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaymentsRepository {
  private readonly payments = new Map<string, Payment>();
  private readonly events = new Map<string, PaymentEvent>();

  async createPayment(input: {
    userId: string;
    orderId: string;
    provider: PaymentProvider;
    amount: number;
    currency: 'EUR';
  }): Promise<Payment> {
    const payment: Payment = {
      id: crypto.randomUUID(),
      userId: input.userId,
      orderId: input.orderId,
      provider: input.provider,
      amount: input.amount,
      currency: input.currency,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.payments.set(payment.id, payment);
    return payment;
  }

  async attachProviderReference(paymentId: string, providerPaymentId: string): Promise<Payment> {
    const payment = this.mustFindPayment(paymentId);
    payment.providerPaymentId = providerPaymentId;
    payment.updatedAt = new Date();
    return payment;
  }

  async findByProviderReference(provider: PaymentProvider, providerPaymentId: string): Promise<Payment | null> {
    return (
      [...this.payments.values()].find(
        (payment) => payment.provider === provider && payment.providerPaymentId === providerPaymentId,
      ) ?? null
    );
  }

  async updateStatus(paymentId: string, status: PaymentStatus): Promise<Payment> {
    const payment = this.mustFindPayment(paymentId);
    payment.status = status;
    payment.updatedAt = new Date();

    if (status === 'succeeded') {
      payment.succeededAt = new Date();
    }
    if (status === 'failed') {
      payment.failedAt = new Date();
    }

    return payment;
  }

  async recordWebhookEvent(input: {
    provider: PaymentProvider;
    providerEventId: string;
    eventType: string;
    payload: unknown;
    paymentId?: string;
  }): Promise<{ event: PaymentEvent; duplicate: boolean }> {
    const key = `${input.provider}:${input.providerEventId}`;
    const existing = this.events.get(key);
    if (existing) {
      return { event: existing, duplicate: true };
    }

    const event: PaymentEvent = {
      id: crypto.randomUUID(),
      paymentId: input.paymentId,
      provider: input.provider,
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      payload: input.payload,
      createdAt: new Date(),
    };
    this.events.set(key, event);
    return { event, duplicate: false };
  }

  async markEventProcessed(provider: PaymentProvider, providerEventId: string, error?: string): Promise<void> {
    const event = this.events.get(`${provider}:${providerEventId}`);
    if (!event) {
      return;
    }

    event.processedAt = new Date();
    event.processingError = error;
  }

  private mustFindPayment(paymentId: string): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found.');
    }

    return payment;
  }
}
