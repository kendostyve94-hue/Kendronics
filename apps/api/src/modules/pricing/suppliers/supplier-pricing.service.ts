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
    let lastError: unknown;

    for (const provider of providers) {
      if (!provider.isConfigured()) continue;
      try {
        return await provider.getPcbQuote(dto);
      } catch (error) {
        lastError = error;
        if (this.isLiveSupplierPricingRequired()) {
          throw error;
        }
      }
    }

    if (this.isLiveSupplierPricingRequired()) {
      throw lastError instanceof Error
        ? new ServiceUnavailableException(lastError.message)
        : new ServiceUnavailableException('Live supplier pricing is required, but no supplier API is configured.');
    }

    return this.getLocalQuote(dto);
  }

  async testSupplierConnection(supplier = this.preferredSupplier()) {
    const normalizedSupplier = supplier.trim().toLowerCase();
    const provider = normalizedSupplier === 'pcbway' ? this.pcbway : this.jlcpcb;
    const expectedEnv =
      normalizedSupplier === 'pcbway'
        ? ['PCBWAY_API_KEY', 'PCBWAY_QUOTE_ENDPOINT']
        : ['JLCPCB_API_KEY', 'JLCPCB_QUOTE_ENDPOINT'];

    if (!provider.isConfigured()) {
      return {
        supplier: provider.name,
        configured: false,
        ok: false,
        expectedEnv,
        message: `${provider.name} quote API is not configured.`,
      };
    }

    try {
      const accountProbe = normalizedSupplier === 'pcbway' ? await this.pcbway.testAccountConnection() : undefined;
      if (accountProbe && !accountProbe.ok) {
        return {
          supplier: provider.name,
          configured: true,
          ok: false,
          expectedEnv,
          account: accountProbe,
          message: accountProbe.message,
        };
      }

      const quote = await provider.getPcbQuote({
        productType: 'standard_pcb',
        gerberFileId: crypto.randomUUID(),
        layers: 2,
        lengthMm: 100,
        widthMm: 100,
        quantity: 5,
        destinationCountryIso2: 'SN',
        shippingMode: 'standard',
        configSnapshot: {
          baseMaterial: 'FR4',
          thickness: '1.6mm',
          solderMaskColor: 'Green',
          silkscreenColor: 'White',
          surfaceFinish: 'HASL lead-free',
          viaCovering: 'Tented',
          deliveryFormat: 'single_pcb',
          differentDesigns: 1,
          outerCopperWeight: '1 oz',
          innerCopperWeight: '0.5 oz',
          minimumViaHole: '0.3mm',
        },
      });

      return {
        supplier: provider.name,
        configured: true,
        ok: true,
        expectedEnv,
        account: accountProbe,
        quote: {
          supplierQuoteId: quote.supplierQuoteId,
          manufacturingPrice: quote.manufacturingPrice,
          shippingPrice: quote.shippingPrice,
          currency: quote.currency,
          leadTimeDays: quote.leadTimeDays,
        },
        message: `${provider.name} quote API responded successfully.`,
      };
    } catch (error) {
      return {
        supplier: provider.name,
        configured: true,
        ok: false,
        expectedEnv,
        message: error instanceof Error ? error.message : `${provider.name} quote API test failed.`,
      };
    }
  }

  private async getLocalQuote(dto: CreateQuoteDto): Promise<SupplierQuote> {
    const rules = await this.pricingRules.getActiveRules();
    const layerMultiplier = rules.layerMultipliers[dto.layers];
    if (!layerMultiplier) {
      throw new ServiceUnavailableException('Unsupported PCB layer count for local supplier estimate.');
    }

    const areaCm2 = (dto.lengthMm * dto.widthMm) / 100;
    const manufacturingPrice = areaCm2 * dto.quantity * rules.areaRate * layerMultiplier * productMultiplier(dto.productType);
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

function productMultiplier(productType: string): number {
  return {
    standard_pcb: 1,
    advanced_pcb: 1.28,
    fpc_rigid_flex: 1.42,
    pcb_assembly: 1.18,
    smt_stencil: 0.72,
    cnc_3d: 1.65,
  }[productType] ?? 1;
}
