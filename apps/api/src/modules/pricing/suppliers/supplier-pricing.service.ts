import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { PricingRuleRepository } from '../repositories/pricing-rule.repository';
import { JlcpcbPricingProvider } from './jlcpcb-pricing.provider';
import { PcbWayPricingProvider } from './pcbway-pricing.provider';
import { SupplierQuote } from './supplier-pricing.provider';

@Injectable()
export class SupplierPricingService {
  constructor(
    private readonly jlcpcb: JlcpcbPricingProvider,
    private readonly pcbway: PcbWayPricingProvider,
    private readonly pricingRules: PricingRuleRepository,
  ) {}

  async getBestQuote(dto: CreateQuoteDto): Promise<SupplierQuote> {
    const preferred = this.preferredSupplier();
    const providers = preferred === 'pcbway' ? [this.pcbway, this.jlcpcb] : [this.jlcpcb, this.pcbway];

    for (const provider of providers) {
      if (!provider.isConfigured()) continue;
      return provider.getPcbQuote(dto);
    }

    if (this.isLiveSupplierPricingRequired()) {
      throw new ServiceUnavailableException('Live supplier pricing is required, but no supplier API is configured.');
    }

    return this.getLocalQuote(dto);
  }

  private async getLocalQuote(dto: CreateQuoteDto): Promise<SupplierQuote> {
    const rules = await this.pricingRules.getActiveRules();
    const layerMultiplier = rules.layerMultipliers[dto.layers];
    if (!layerMultiplier) {
      throw new ServiceUnavailableException('Unsupported PCB layer count for local supplier estimate.');
    }

    const areaCm2 = (dto.lengthMm * dto.widthMm) / 100;
    const manufacturingPrice = areaCm2 * dto.quantity * rules.areaRate * layerMultiplier;
    return {
      supplier: 'local_calibrated_supplier_estimate',
      manufacturingPrice: round(manufacturingPrice),
      shippingPrice: rules.zoneBaseDeliveryFee,
      currency: 'EUR',
    };
  }

  private preferredSupplier(): string {
    return process.env.PREFERRED_PCB_SUPPLIER?.trim().toLowerCase() || 'jlcpcb';
  }

  private isLiveSupplierPricingRequired(): boolean {
    return process.env.REQUIRE_LIVE_SUPPLIER_PRICING?.trim().toLowerCase() === 'true';
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
