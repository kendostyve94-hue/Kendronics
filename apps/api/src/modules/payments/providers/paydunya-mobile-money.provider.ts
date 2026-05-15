import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MobileMoneyProvider } from './mobile-money.provider';
import {
  MobileMoneyInitiationInput,
  MobileMoneyInitiationResult,
  VerifiedMobileMoneyPaymentEvent,
} from './payment-provider.types';
import {
  convertEuroToMobileMoneyAmount,
  getMobileMoneyNotifyUrl,
  getMobileMoneyReturnUrl,
} from './mobile-money-amount';

interface PayDunyaCreateInvoiceResponse {
  response_code?: string;
  response_text?: string;
  description?: string;
  token?: string;
}

interface PayDunyaConfirmInvoiceResponse {
  response_code?: string;
  status?: string;
  invoice?: {
    token?: string;
  };
}

@Injectable()
export class PayDunyaMobileMoneyProvider extends MobileMoneyProvider {
  async initiate(input: MobileMoneyInitiationInput): Promise<MobileMoneyInitiationResult> {
    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    const token = process.env.PAYDUNYA_TOKEN;
    if (!masterKey || !privateKey || !token) {
      throw new ServiceUnavailableException('PayDunya Mobile Money is not configured.');
    }

    const baseUrl = process.env.PAYDUNYA_MODE === 'sandbox'
      ? 'https://app.paydunya.com/sandbox-api/v1'
      : 'https://app.paydunya.com/api/v1';

    const response = await fetch(`${baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': masterKey,
        'PAYDUNYA-PRIVATE-KEY': privateKey,
        'PAYDUNYA-TOKEN': token,
      },
      body: JSON.stringify({
        invoice: {
          total_amount: convertEuroToMobileMoneyAmount(input.amount),
          description: `Kendronics order ${input.orderId}`,
        },
        store: {
          name: process.env.PAYDUNYA_STORE_NAME ?? 'Kendronics',
        },
        custom_data: {
          paymentId: input.paymentId,
          orderId: input.orderId,
          countryIso2: input.countryIso2,
          phoneNumber: input.phoneNumber,
        },
        actions: {
          callback_url: getMobileMoneyNotifyUrl('paydunya'),
          return_url: getMobileMoneyReturnUrl(input.orderId),
          cancel_url: getMobileMoneyReturnUrl(input.orderId),
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as PayDunyaCreateInvoiceResponse | null;
    if (!response.ok || payload?.response_code !== '00' || !payload.token || !payload.response_text) {
      throw new ServiceUnavailableException(payload?.description ?? payload?.response_text ?? 'PayDunya could not create the payment link.');
    }

    return {
      providerReference: payload.token,
      checkoutUrl: payload.response_text,
      status: 'pending',
    };
  }

  async verifyNotification(input: unknown): Promise<VerifiedMobileMoneyPaymentEvent> {
    const token = findPayDunyaToken(input);
    if (!token) {
      throw new ServiceUnavailableException('PayDunya notification token is missing.');
    }

    const payload = await this.confirmInvoice(token);
    const status = mapPayDunyaStatus(payload.status);
    return {
      providerEventId: `paydunya_${token}_${status}`,
      providerReference: token,
      status,
    };
  }

  private async confirmInvoice(token: string): Promise<PayDunyaConfirmInvoiceResponse> {
    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    const payDunyaToken = process.env.PAYDUNYA_TOKEN;
    if (!masterKey || !privateKey || !payDunyaToken) {
      throw new ServiceUnavailableException('PayDunya Mobile Money is not configured.');
    }

    const baseUrl = process.env.PAYDUNYA_MODE === 'sandbox'
      ? 'https://app.paydunya.com/sandbox-api/v1'
      : 'https://app.paydunya.com/api/v1';

    const response = await fetch(`${baseUrl}/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': masterKey,
        'PAYDUNYA-PRIVATE-KEY': privateKey,
        'PAYDUNYA-TOKEN': payDunyaToken,
      },
    });
    const payload = (await response.json().catch(() => null)) as PayDunyaConfirmInvoiceResponse | null;
    if (!response.ok || payload?.response_code !== '00') {
      throw new ServiceUnavailableException('PayDunya transaction verification failed.');
    }

    return payload;
  }
}

function findPayDunyaToken(input: unknown): string | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const record = input as Record<string, unknown>;
  const direct = stringValue(record.token);
  if (direct) {
    return direct;
  }

  const data = record.data;
  if (data && typeof data === 'object') {
    const invoice = (data as Record<string, unknown>).invoice;
    if (invoice && typeof invoice === 'object') {
      return stringValue((invoice as Record<string, unknown>).token);
    }
  }

  return undefined;
}

function mapPayDunyaStatus(status: string | undefined): VerifiedMobileMoneyPaymentEvent['status'] {
  const normalized = status?.toLowerCase();
  if (normalized === 'completed') {
    return 'confirmed';
  }
  if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'failed') {
    return 'failed';
  }

  return 'pending';
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
