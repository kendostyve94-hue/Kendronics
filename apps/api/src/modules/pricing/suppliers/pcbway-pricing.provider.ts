import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import {
  SupplierPricingProvider,
  SupplierQuote,
  toSupplierPcbPayload,
} from './supplier-pricing.provider';

@Injectable()
export class PcbWayPricingProvider implements SupplierPricingProvider {
  readonly name = 'pcbway';

  isConfigured(): boolean {
    return Boolean(this.configValue('PCBWAY_API_KEY'));
  }

  async getPcbQuote(dto: CreateQuoteDto): Promise<SupplierQuote> {
    const apiKey = this.configValue('PCBWAY_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('PCBWay quote API is not configured.');
    }

    const endpoint = this.configValue('PCBWAY_QUOTE_ENDPOINT') ?? 'https://api-partner.pcbway.com/api/Pcb/PcbQuotation';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.toPcbWayPayload(toSupplierPcbPayload(dto))),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.Status === 'error') {
      throw new ServiceUnavailableException(data?.ErrorText ?? 'PCBWay live quote failed.');
    }

    const manufacturingPrice = Number(data.priceList?.[0]?.Price ?? data.Price ?? 0);
    const shippingPrice = Number(data.Shipping?.ShipCost ?? 0);
    if (!Number.isFinite(manufacturingPrice) || manufacturingPrice <= 0) {
      throw new ServiceUnavailableException('PCBWay live quote did not include a valid manufacturing price.');
    }

    return {
      supplier: this.name,
      supplierQuoteId: data.QuoteId ?? data.quoteId,
      manufacturingPrice: round(manufacturingPrice),
      shippingPrice: round(Number.isFinite(shippingPrice) ? shippingPrice : 0),
      currency: 'EUR',
      leadTimeDays: Number(data.priceList?.[0]?.BuildDays ?? data.BuildDays) || undefined,
      rawResponse: data,
    };
  }

  private toPcbWayPayload(payload: ReturnType<typeof toSupplierPcbPayload>): Record<string, unknown> {
    return {
      country: payload.destinationCountryIso2,
      countryCode: payload.destinationCountryIso2,
      shipType: payload.shippingMode,
      boardType: payload.boardType === 'panel_as_designed' ? 'Panel PCB as design' : payload.boardType === 'panel_by_supplier' ? 'Panel PCB by Supplier' : 'Single PCB',
      designInPanel: payload.differentDesigns,
      length: payload.lengthMm,
      width: payload.widthMm,
      qty: payload.quantity,
      layers: payload.layers,
      material: payload.material,
      thickness: payload.thicknessMm,
      solderMask: payload.solderMaskColor,
      silkscreen: payload.silkscreenColor,
      surfaceFinish: payload.surfaceFinish,
      viaCovering: payload.viaCovering,
      productionSpeed: payload.productionSpeed,
      outerCopperWeight: payload.outerCopperWeight,
      innerCopperWeight: payload.innerCopperWeight,
      minHoleSize: payload.minimumHoleSizeMm,
      goldFingers: yesNo(payload.options.goldFingers),
      castellatedHoles: yesNo(payload.options.castellatedHoles),
      edgePlating: yesNo(payload.options.edgePlating),
      blindBuriedVias: yesNo(payload.options.blindBuriedVias),
      viaInPad: yesNo(payload.options.viaInPad),
      carbonMask: yesNo(payload.options.carbonMask),
      countersink: yesNo(payload.options.countersink),
      pressFitHoles: yesNo(payload.options.pressFitHoles),
    };
  }

  private configValue(key: string): string | undefined {
    const value = process.env[key]?.trim();
    return value && value !== 'not-configured' ? value : undefined;
  }
}

function yesNo(value: boolean): 'Yes' | 'No' {
  return value ? 'Yes' : 'No';
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
