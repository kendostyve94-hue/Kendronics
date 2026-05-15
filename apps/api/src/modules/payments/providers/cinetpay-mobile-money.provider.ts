import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MobileMoneyProvider } from './mobile-money.provider';
import {
  MobileMoneyInitiationInput,
  MobileMoneyInitiationResult,
  VerifiedMobileMoneyPaymentEvent,
} from './payment-provider.types';
import {
  convertEuroToMobileMoneyAmount,
  getMobileMoneyCurrency,
  getMobileMoneyNotifyUrl,
  getMobileMoneyReturnUrl,
} from './mobile-money-amount';

interface CinetPayCreatePaymentResponse {
  code?: string;
  message?: string;
  description?: string;
  data?: {
    payment_token?: string;
    payment_url?: string;
  };
}

interface CinetPayCheckPaymentResponse {
  code?: string;
  message?: string;
  data?: {
    status?: string;
  };
}

@Injectable()
export class CinetPayMobileMoneyProvider extends MobileMoneyProvider {
  async initiate(input: MobileMoneyInitiationInput): Promise<MobileMoneyInitiationResult> {
    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;
    if (!apiKey || !siteId) {
      throw new ServiceUnavailableException('CinetPay Mobile Money is not configured.');
    }

    const transactionId = this.transactionId(input.paymentId);
    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: transactionId,
        amount: convertEuroToMobileMoneyAmount(input.amount),
        currency: getMobileMoneyCurrency(),
        description: `Kendronics order ${input.orderId}`,
        notify_url: getMobileMoneyNotifyUrl('cinetpay'),
        return_url: getMobileMoneyReturnUrl(input.orderId),
        channels: 'MOBILE_MONEY',
        metadata: input.paymentId,
        customer_phone_number: input.phoneNumber,
        customer_country: input.countryIso2,
        lang: 'FR',
      }),
    });

    const payload = (await response.json().catch(() => null)) as CinetPayCreatePaymentResponse | null;
    const checkoutUrl = payload?.data?.payment_url;
    if (!response.ok || payload?.code !== '201' || !checkoutUrl) {
      throw new ServiceUnavailableException(payload?.description ?? payload?.message ?? 'CinetPay could not create the payment link.');
    }

    return {
      providerReference: transactionId,
      checkoutUrl,
      status: 'pending',
    };
  }

  async verifyNotification(input: Record<string, unknown>): Promise<VerifiedMobileMoneyPaymentEvent> {
    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;
    const transactionId = stringValue(input.cpm_trans_id);
    if (!apiKey || !siteId || !transactionId) {
      throw new ServiceUnavailableException('CinetPay notification cannot be verified.');
    }

    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: transactionId,
      }),
    });

    const payload = (await response.json().catch(() => null)) as CinetPayCheckPaymentResponse | null;
    if (!response.ok || !payload) {
      throw new ServiceUnavailableException('CinetPay transaction verification failed.');
    }

    const status = this.mapStatus(payload.code, payload.data?.status);
    return {
      providerEventId: `cinetpay_${transactionId}_${status}`,
      providerReference: transactionId,
      status,
    };
  }

  private transactionId(paymentId: string): string {
    return paymentId.replace(/-/g, '').slice(0, 32);
  }

  private mapStatus(code: string | undefined, status: string | undefined): VerifiedMobileMoneyPaymentEvent['status'] {
    const normalizedStatus = status?.toUpperCase();
    if (code === '00' || normalizedStatus === 'ACCEPTED') {
      return 'confirmed';
    }
    if (normalizedStatus === 'REFUSED' || normalizedStatus === 'CANCELLED' || normalizedStatus === 'CANCELED') {
      return 'failed';
    }

    return 'pending';
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
