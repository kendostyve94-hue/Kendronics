import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CheckoutSession } from '../entities/checkout-session.entity';
import { CreatePaypalOrderInput, PaypalAuthorizationResult } from './payment-provider.types';

@Injectable()
export class PaypalPaymentProvider {
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly baseUrl: string;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.baseUrl = process.env.PAYPAL_ENV === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  async createOrder(input: CreatePaypalOrderInput): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('PayPal is not configured for production payments.');
      }

      return {
        paymentId: input.paymentId,
        provider: 'paypal',
        providerSessionId: `pp_sim_${input.paymentId}`,
        checkoutUrl: `${input.returnUrl}${input.returnUrl.includes('?') ? '&' : '?'}paypalOrderId=pp_sim_${input.paymentId}`,
        status: 'pending',
      };
    }

    const payload = await this.paypalRequest<PaypalOrderResponse>('/v2/checkout/orders', {
      method: 'POST',
      body: {
        intent: 'AUTHORIZE',
        purchase_units: [
          {
            reference_id: input.paymentId,
            custom_id: input.orderId,
            description: `Kendronics PCB order ${input.orderId}`,
            amount: {
              currency_code: input.currency,
              value: input.amount.toFixed(2),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: process.env.PAYPAL_BRAND_NAME || 'Kendronics',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: input.returnUrl,
              cancel_url: input.cancelUrl,
            },
          },
        },
      },
    });

    const approvalUrl = payload.links?.find((link) => link.rel === 'payer-action' || link.rel === 'approve')?.href;
    if (!payload.id || !approvalUrl) {
      throw new ServiceUnavailableException('PayPal did not return an approval URL.');
    }

    return {
      paymentId: input.paymentId,
      provider: 'paypal',
      providerSessionId: payload.id,
      checkoutUrl: approvalUrl,
      status: 'pending',
    };
  }

  async authorizeOrder(paypalOrderId: string): Promise<PaypalAuthorizationResult> {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('PayPal is not configured for production payments.');
      }

      return {
        paypalOrderId,
        authorizationId: `pp_auth_sim_${paypalOrderId}`,
        captureBefore: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
        raw: { simulated: true, paypalOrderId },
      };
    }

    const payload = await this.paypalRequest<PaypalAuthorizeResponse>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/authorize`, {
      method: 'POST',
      body: {},
    });
    const authorization = payload.purchase_units?.flatMap((unit) => unit.payments?.authorizations ?? [])[0];
    if (!authorization?.id) {
      throw new ServiceUnavailableException('PayPal did not return an authorization ID.');
    }

    return {
      paypalOrderId,
      authorizationId: authorization.id,
      captureBefore: authorization.expiration_time ? new Date(authorization.expiration_time) : undefined,
      raw: payload,
    };
  }

  async captureAuthorization(authorizationId: string) {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('PayPal is not configured for production payments.');
      }
      return;
    }

    await this.paypalRequest(`/v2/payments/authorizations/${encodeURIComponent(authorizationId)}/capture`, {
      method: 'POST',
      body: { final_capture: true },
    });
  }

  async cancelAuthorization(authorizationId: string) {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('PayPal is not configured for production payments.');
      }
      return;
    }

    await this.paypalRequest(`/v2/payments/authorizations/${encodeURIComponent(authorizationId)}/void`, {
      method: 'POST',
    });
  }

  private isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private async paypalRequest<T = unknown>(path: string, input: { method: 'GET' | 'POST'; body?: unknown }): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: input.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) as T : ({} as T);
    if (!response.ok) {
      throw new ServiceUnavailableException(paypalErrorMessage(payload));
    }
    return payload;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new ServiceUnavailableException('PayPal credentials are missing.');
    }

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });
    const payload = await response.json() as { access_token?: string; error_description?: string };
    if (!response.ok || !payload.access_token) {
      throw new ServiceUnavailableException(payload.error_description || 'Unable to authenticate with PayPal.');
    }
    return payload.access_token;
  }
}

type PaypalLink = { rel: string; href: string };
type PaypalOrderResponse = { id?: string; links?: PaypalLink[] };
type PaypalAuthorizeResponse = {
  purchase_units?: Array<{
    payments?: {
      authorizations?: Array<{ id?: string; expiration_time?: string }>;
    };
  }>;
};

function paypalErrorMessage(payload: unknown): string {
  const value = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  if (typeof value.message === 'string') return value.message;
  if (typeof value.error_description === 'string') return value.error_description;
  if (typeof value.name === 'string') return `PayPal error: ${value.name}`;
  return 'PayPal request failed.';
}

