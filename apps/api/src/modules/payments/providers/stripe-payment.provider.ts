import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import { CheckoutSession } from '../entities/checkout-session.entity';
import { CreateProviderCheckoutInput, VerifiedStripePaymentEvent } from './payment-provider.types';

@Injectable()
export class StripePaymentProvider {
  private readonly stripe: Stripe | null;
  private readonly webhookSecret?: string;

  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion,
        })
      : null;
  }

  async createCheckoutSession(input: CreateProviderCheckoutInput): Promise<CheckoutSession> {
    if (!this.stripe) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Stripe is not configured for production payments.');
      }

      return {
        paymentId: input.paymentId,
        provider: 'stripe',
        providerSessionId: `cs_sim_${input.paymentId}`,
        checkoutUrl: `https://checkout.stripe.com/pay/cs_sim_${input.paymentId}`,
        status: 'pending',
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      client_reference_id: input.orderId,
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Kendronics PCB order ${input.orderId}`,
        },
      },
      metadata: {
        paymentId: input.paymentId,
        orderId: input.orderId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: Math.round(input.amount * 100),
            product_data: {
              name: `Kendronics PCB order ${input.orderId}`,
              description: 'PCB ordering and logistics service using trusted external manufacturing partners.',
            },
          },
        },
      ],
    });

    if (!session.url) {
      throw new ServiceUnavailableException('Stripe did not return a checkout URL.');
    }

    return {
      paymentId: input.paymentId,
      provider: 'stripe',
      providerSessionId: session.id,
      checkoutUrl: session.url,
      status: 'pending',
    };
  }

  verifyWebhook(
    signature: string,
    rawBody: Buffer | undefined,
    parsedBody: unknown,
  ): VerifiedStripePaymentEvent {
    if (!this.stripe || !this.webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Stripe webhooks are not configured for production payments.');
      }

      return this.verifySimulatedWebhook(parsedBody);
    }

    if (!rawBody) {
      throw new BadRequestException('Stripe webhook raw body is required for signature verification.');
    }

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    return this.mapStripeEvent(event);
  }

  private verifySimulatedWebhook(parsedBody: unknown): VerifiedStripePaymentEvent {
    const event = parsedBody as Partial<VerifiedStripePaymentEvent>;
    if (!event.id || !event.type || !event.providerPaymentId || !event.paymentStatus) {
      throw new BadRequestException('Invalid simulated Stripe webhook payload.');
    }

    return {
      id: event.id,
      type: event.type,
      providerPaymentId: event.providerPaymentId,
      paymentStatus: event.paymentStatus,
      raw: parsedBody,
    };
  }

  private mapStripeEvent(event: Stripe.Event): VerifiedStripePaymentEvent {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        id: event.id,
        type: event.type,
        providerPaymentId: session.id,
        paymentStatus: session.payment_status === 'paid' ? 'succeeded' : 'pending',
        raw: event,
      };
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        id: event.id,
        type: event.type,
        providerPaymentId: session.id,
        paymentStatus: 'succeeded',
        raw: event,
      };
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        id: event.id,
        type: event.type,
        providerPaymentId: session.id,
        paymentStatus: 'failed',
        raw: event,
      };
    }

    return {
      id: event.id,
      type: event.type,
      providerPaymentId: event.id,
      paymentStatus: 'ignored',
      raw: event,
    };
  }
}
