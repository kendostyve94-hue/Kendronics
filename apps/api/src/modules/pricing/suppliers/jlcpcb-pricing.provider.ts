import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import {
  SupplierPricingProvider,
  SupplierQuote,
  toSupplierPcbPayload,
} from './supplier-pricing.provider';

@Injectable()
export class JlcpcbPricingProvider implements SupplierPricingProvider {
  readonly name = 'jlcpcb';

  isConfigured(): boolean {
    return Boolean(this.configValue('JLCPCB_API_KEY') && this.configValue('JLCPCB_QUOTE_ENDPOINT'));
  }

  async getPcbQuote(dto: CreateQuoteDto): Promise<SupplierQuote> {
    const apiKey = this.configValue('JLCPCB_API_KEY');
    const endpoint = this.configValue('JLCPCB_QUOTE_ENDPOINT');
    if (!apiKey || !endpoint) {
      throw new ServiceUnavailableException('JLCPCB quote API is not configured.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toSupplierPcbPayload(dto)),
    });

    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok || !data) {
      throw new ServiceUnavailableException('JLCPCB quote API did not return a valid JSON response.');
    }
    if (this.isErrorResponse(data)) {
      throw new ServiceUnavailableException(String(data.message ?? data.error ?? 'JLCPCB quote failed.'));
    }

    const manufacturingPrice = this.firstNumber(data, [
      'manufacturingPrice',
      'pcbPrice',
      'boardPrice',
      'price',
      'amount',
      'totalPcbPrice',
    ]);
    const shippingPrice = this.firstNumber(data, ['shippingPrice', 'shipCost', 'freight', 'shipping']);
    if (!Number.isFinite(manufacturingPrice) || manufacturingPrice <= 0) {
      throw new ServiceUnavailableException('JLCPCB quote response did not include a valid PCB manufacturing price.');
    }

    return {
      supplier: this.name,
      supplierQuoteId: this.firstString(data, ['quoteId', 'quotationId', 'id', 'orderNo']),
      manufacturingPrice: round(manufacturingPrice),
      shippingPrice: round(Number.isFinite(shippingPrice) ? shippingPrice : 0),
      currency: this.currency(data),
      leadTimeDays: this.firstNumber(data, ['leadTimeDays', 'buildDays', 'productionDays']),
      rawResponse: data,
    };
  }

  private isErrorResponse(data: Record<string, unknown>): boolean {
    const status = String(data.status ?? data.Status ?? '').toLowerCase();
    return status === 'error' || data.success === false || Boolean(data.error);
  }

  private firstNumber(data: Record<string, unknown>, keys: string[]): number {
    for (const key of keys) {
      const value = this.deepValue(data, key);
      const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
      if (Number.isFinite(numberValue)) return numberValue;
    }

    return Number.NaN;
  }

  private firstString(data: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = this.deepValue(data, key);
      if (typeof value === 'string' && value.trim()) return value;
      if (typeof value === 'number') return String(value);
    }

    return undefined;
  }

  private deepValue(data: Record<string, unknown>, targetKey: string): unknown {
    const direct = data[targetKey];
    if (direct != null) return direct;

    for (const value of Object.values(data)) {
      if (!value || typeof value !== 'object') continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object') {
            const found = this.deepValue(item as Record<string, unknown>, targetKey);
            if (found != null) return found;
          }
        }
      } else {
        const found = this.deepValue(value as Record<string, unknown>, targetKey);
        if (found != null) return found;
      }
    }

    return undefined;
  }

  private currency(data: Record<string, unknown>): 'EUR' | 'USD' {
    return String(data.currency ?? data.Currency ?? '').toUpperCase() === 'USD' ? 'USD' : 'EUR';
  }

  private configValue(key: string): string | undefined {
    const value = process.env[key]?.trim();
    return value && value !== 'not-configured' ? value : undefined;
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
