import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import { CheckoutSession } from '../entities/checkout-session.entity';
import { CreateProjectCheckoutInput, CreateProviderCheckoutInput, VerifiedStripePaymentEvent } from './payment-provider.types';

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
      payment_method_types: ['card'],
      payment_intent_data: {
        capture_method: 'manual',
        metadata: {
          paymentId: input.paymentId,
          orderId: input.orderId,
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
              description: 'PCB ordering, technical review, production coordination and logistics service.',
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

  async createProjectCheckoutSession(input: CreateProjectCheckoutInput): Promise<CheckoutSession> {
    if (!this.stripe) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Stripe is not configured for production payments.');
      }

      return {
        paymentId: input.purchaseId,
        provider: 'stripe',
        providerSessionId: `cs_project_sim_${input.purchaseId}`,
        checkoutUrl: `https://checkout.stripe.com/pay/cs_project_sim_${input.purchaseId}`,
        status: 'pending',
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      client_reference_id: input.purchaseId,
      metadata: {
        marketplacePurchaseId: input.purchaseId,
        projectId: input.projectId,
        buyerId: input.buyerId,
      },
      payment_intent_data: {
        metadata: {
          marketplacePurchaseId: input.purchaseId,
          projectId: input.projectId,
          buyerId: input.buyerId,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountCents,
            product_data: {
              name: input.title,
              description: 'Licence de projet hardware Kendronics.',
            },
          },
        },
      ],
    });

    if (!session.url) {
      throw new ServiceUnavailableException('Stripe did not return a checkout URL.');
    }

    return {
      paymentId: input.purchaseId,
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
      providerIntentId: event.providerIntentId,
      localPaymentId: event.localPaymentId,
      marketplacePurchaseId: event.marketplacePurchaseId,
      captureBefore: event.captureBefore ? new Date(event.captureBefore) : undefined,
      paymentStatus: event.paymentStatus,
      raw: parsedBody,
    };
  }

  async capturePaymentIntent(paymentIntentId: string) {
    if (!this.stripe) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Stripe is not configured for production payments.');
      }
      return;
    }

    await this.stripe.paymentIntents.capture(paymentIntentId);
  }

  async cancelPaymentIntent(paymentIntentId: string) {
    if (!this.stripe) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Stripe is not configured for production payments.');
      }
      return;
    }

    await this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  private mapStripeEvent(event: Stripe.Event): VerifiedStripePaymentEvent {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId = stringId(session.payment_intent);
      return {
        id: event.id,
        type: event.type,
        providerPaymentId: session.id,
        providerIntentId: paymentIntentId,
        localPaymentId: stringMetadata(session.metadata?.paymentId),
        marketplacePurchaseId: stringMetadata(session.metadata?.marketplacePurchaseId),
        paymentStatus: session.payment_status === 'paid' ? 'succeeded' : paymentIntentId ? 'authorized' : 'pending',
        raw: event,
      };
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        id: event.id,
        type: event.type,
        providerPaymentId: session.id,
        providerIntentId: stringId(session.payment_intent),
        localPaymentId: stringMetadata(session.metadata?.paymentId),
        marketplacePurchaseId: stringMetadata(session.metadata?.marketplacePurchaseId),
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
        providerIntentId: stringId(session.payment_intent),
        localPaymentId: stringMetadata(session.metadata?.paymentId),
        marketplacePurchaseId: stringMetadata(session.metadata?.marketplacePurchaseId),
        paymentStatus: 'failed',
        raw: event,
      };
    }

    if (
      event.type === 'payment_intent.amount_capturable_updated' ||
      event.type === 'payment_intent.succeeded' ||
      event.type === 'payment_intent.canceled' ||
      event.type === 'payment_intent.payment_failed'
    ) {
      const intent = event.data.object as Stripe.PaymentIntent;
      return {
        id: event.id,
        type: event.type,
        providerPaymentId: intent.id,
        providerIntentId: intent.id,
        localPaymentId: stringMetadata(intent.metadata?.paymentId),
        marketplacePurchaseId: stringMetadata(intent.metadata?.marketplacePurchaseId),
        captureBefore: captureBeforeFromPaymentIntent(intent),
        paymentStatus:
          event.type === 'payment_intent.amount_capturable_updated'
            ? 'authorized'
            : event.type === 'payment_intent.succeeded'
              ? 'succeeded'
              : event.type === 'payment_intent.canceled'
                ? cancelStatus(intent)
                : 'failed',
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

function stringId(value: string | Stripe.PaymentIntent | null): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.id;
}

function stringMetadata(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function cancelStatus(intent: Stripe.PaymentIntent): 'canceled' | 'expired' {
  return intent.cancellation_reason === 'abandoned' ? 'expired' : 'canceled';
}

function captureBeforeFromPaymentIntent(intent: Stripe.PaymentIntent): Date | undefined {
  const latestCharge = intent.latest_charge;
  if (!latestCharge || typeof latestCharge === 'string') return undefined;
  const captureBefore = latestCharge.payment_method_details?.card?.capture_before;
  return captureBefore ? new Date(captureBefore * 1000) : undefined;
}
