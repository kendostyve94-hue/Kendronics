import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { PricingBreakdown, Quote } from './entities/quote.entity';
import { PricingRuleRepository } from './repositories/pricing-rule.repository';
import { SmartBufferResult, SmartBufferService } from './smart-buffer.service';

interface SupplierEstimate {
  supplier: string;
  manufacturingPrice: number;
  shippingPrice: number;
}

@Injectable()
export class PricingService {
  constructor(
    private readonly pricingRules: PricingRuleRepository,
    private readonly prisma: PrismaService,
    private readonly smartBuffer: SmartBufferService,
    private readonly uploadsService: UploadsService,
  ) {}

  async createQuote(userId: string, dto: CreateQuoteDto): Promise<Quote> {
    const effectiveDto = await this.applyGerberAnalysis(userId, dto);

    if (effectiveDto.productType === 'pcb_assembly' && (!effectiveDto.bomFileId || !effectiveDto.cplFileId)) {
      throw new BadRequestException('PCB assembly requires BOM and CPL files.');
    }

    const supplierEstimate = await this.getLiveSupplierEstimate(effectiveDto);
    if (supplierEstimate) {
      const smartPrice = await this.smartBuffer.priceQuote({
        dto: effectiveDto,
        supplier: supplierEstimate.supplier,
        supplierEstimatedPrice: supplierEstimate.manufacturingPrice,
        shippingPrice: this.customerShippingPrice(effectiveDto, supplierEstimate.shippingPrice),
      });
      return this.persistQuote(userId, effectiveDto, this.toSmartBufferBreakdown(smartPrice), smartPrice);
    }

    if (this.isLiveSupplierPricingRequired()) {
      throw new ServiceUnavailableException(
        'Live supplier pricing is required, but PCBWay API is not configured or did not return a valid quote.',
      );
    }

    const rules = await this.pricingRules.getActiveRules();
    const layerMultiplier = rules.layerMultipliers[effectiveDto.layers];
    if (!layerMultiplier) {
      throw new BadRequestException('Unsupported PCB layer count.');
    }

    const areaCm2 = (effectiveDto.lengthMm * effectiveDto.widthMm) / 100;
    const manufacturing = areaCm2 * effectiveDto.quantity * rules.areaRate * layerMultiplier;
    const smartPrice = await this.smartBuffer.priceQuote({
      dto: effectiveDto,
      supplier: 'local_calibrated_supplier_estimate',
      supplierEstimatedPrice: manufacturing,
      shippingPrice: this.customerShippingPrice(effectiveDto, rules.zoneBaseDeliveryFee),
    });
    return this.persistQuote(userId, effectiveDto, this.toSmartBufferBreakdown(smartPrice), smartPrice);
  }

  private async applyGerberAnalysis(userId: string, dto: CreateQuoteDto): Promise<CreateQuoteDto> {
    const analysis = await this.uploadsService.getAnalysis(userId, dto.gerberFileId);
    if (!analysis) return dto;

    return {
      ...dto,
      layers: analysis.detectedLayers ?? dto.layers,
      lengthMm: analysis.heightMm && analysis.widthMm ? Math.max(analysis.widthMm, analysis.heightMm) : dto.lengthMm,
      widthMm: analysis.heightMm && analysis.widthMm ? Math.min(analysis.widthMm, analysis.heightMm) : dto.widthMm,
      configSnapshot: {
        ...(dto.configSnapshot ?? {}),
        gerberAnalysisApplied: true,
        parserConfidence: analysis.parserConfidence,
        gerberComplexity: analysis.complexity,
        holesCount: analysis.holesCount,
        hasSlots: analysis.hasSlots,
        detectedLayers: analysis.detectedLayers,
        detectedWidthMm: analysis.widthMm,
        detectedHeightMm: analysis.heightMm,
        boardAreaCm2: analysis.boardAreaCm2,
        outlineSource: analysis.outlineSource,
        gerberWarnings: analysis.warnings,
      },
    };
  }

  private async persistQuote(
    userId: string,
    dto: CreateQuoteDto,
    breakdown: PricingBreakdown,
    smartPrice?: SmartBufferResult,
  ): Promise<Quote> {
    const validUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const quote = await this.prisma.quote.create({
      data: {
        userId,
        productType: dto.productType,
        gerberFileId: dto.gerberFileId,
        bomFileId: dto.bomFileId,
        cplFileId: dto.cplFileId,
        layers: dto.layers,
        lengthMm: dto.lengthMm,
        widthMm: dto.widthMm,
        quantity: dto.quantity,
        destinationCountryIso2: dto.destinationCountryIso2,
        shippingMode: dto.shippingMode,
        currency: 'EUR',
        finalTotal: breakdown.finalTotal,
        configSnapshot: dto.configSnapshot as Prisma.InputJsonObject | undefined,
        validUntil,
        breakdown: breakdown as unknown as Prisma.InputJsonObject,
      },
    });
    if (smartPrice) {
      await this.smartBuffer.createSnapshot(quote.id, smartPrice);
    }

    return {
      ...quote,
      lengthMm: Number(quote.lengthMm),
      widthMm: Number(quote.widthMm),
      finalTotal: Number(quote.finalTotal),
      currency: 'EUR',
      breakdown: quote.breakdown as unknown as PricingBreakdown,
      configSnapshot: quote.configSnapshot as Record<string, unknown> | null,
    };
  }

  private toSmartBufferBreakdown(result: SmartBufferResult): PricingBreakdown {
    const bufferAmount = result.pcbClientPrice - result.supplierEstimatedPrice - result.serviceFee;
    return {
      partnerManufacturingCost: round(result.supplierEstimatedPrice),
      partnerHandlingCost: 0,
      ChinaToFranceLogistics: 0,
      FranceProcessingFee: 0,
      FranceToAfricaDelivery: round(result.shippingPrice),
      customsRiskBuffer: round(bufferAmount),
      paymentProcessingFee: 0,
      KendronicsServiceFee: round(result.serviceFee),
      totalBeforeTax: round(result.totalClientPrice),
      taxesIfApplicable: 0,
      finalTotal: round(result.totalClientPrice),
      supplier: result.supplier,
      supplierEstimatedPrice: round(result.supplierEstimatedPrice),
      pcbClientPrice: round(result.pcbClientPrice),
      smartBufferMultiplier: result.bufferUsed,
      smartBufferRiskScore: result.riskScore,
      smartBufferConfidence: result.confidence,
      smartBufferBucketKey: result.bucketKey,
      smartBufferFormulaVersion: result.formulaVersion,
      smartBufferReasons: result.reasons,
    };
  }

  private async getLiveSupplierEstimate(dto: CreateQuoteDto): Promise<SupplierEstimate | null> {
    const apiKey = this.configValue('PCBWAY_API_KEY');
    if (!apiKey || !dto.configSnapshot) return null;

    const endpoint = this.configValue('PCBWAY_QUOTE_ENDPOINT') ?? 'https://api-partner.pcbway.com/api/Pcb/PcbQuotation';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.toPcbWayPayload(dto)),
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
      supplier: 'pcbway',
      manufacturingPrice: round(manufacturingPrice),
      shippingPrice: round(shippingPrice),
    };
  }

  private toPcbWayPayload(dto: CreateQuoteDto): Record<string, unknown> {
    const config = dto.configSnapshot ?? {};
    return {
      country: dto.destinationCountryIso2,
      countryCode: dto.destinationCountryIso2,
      shipType: dto.shippingMode,
      boardType: this.boardTypeFor(config.deliveryFormat),
      designInPanel: this.numberConfig(config.differentDesigns, 1),
      length: dto.lengthMm,
      width: dto.widthMm,
      qty: dto.quantity,
      layers: dto.layers,
      material: this.materialForSupplier(this.stringConfig(config.baseMaterial, 'FR4')),
      thickness: parseFloat(this.stringConfig(config.thickness, '1.6mm')) || 1.6,
      solderMask: this.stringConfig(config.solderMaskColor, 'Green'),
      silkscreen: this.stringConfig(config.silkscreenColor, 'White'),
      surfaceFinish: this.stringConfig(config.surfaceFinish, 'HASL lead-free'),
      viaCovering: this.stringConfig(config.viaCovering, 'Tented'),
      productionSpeed: this.stringConfig(config.productionSpeed, 'standard'),
      outerCopperWeight: this.stringConfig(config.outerCopperWeight, '1 oz'),
      innerCopperWeight: this.stringConfig(config.innerCopperWeight, '0.5 oz'),
      minHoleSize: parseFloat(this.stringConfig(config.minimumViaHole, '0.3mm')) || 0.3,
      goldFingers: this.yesNo(config.goldFingers),
      castellatedHoles: this.yesNo(config.castellatedHoles),
      edgePlating: this.yesNo(config.edgePlating),
      blindBuriedVias: this.yesNo(config.blindBuriedVias),
      viaInPad: this.yesNo(config.viaInPad),
      carbonMask: this.yesNo(config.carbonInk),
      countersink: this.yesNo(config.countersink),
      pressFitHoles: this.yesNo(config.pressFitHoles),
    };
  }

  private boardTypeFor(value: unknown): string {
    if (value === 'customer_panel') return 'Panel PCB as design';
    if (value === 'panel_by_partner') return 'Panel PCB by Supplier';
    return 'Single PCB';
  }

  private materialForSupplier(value: string): string {
    return value === 'FR4' ? 'FR-4' : value;
  }

  private stringConfig(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }

  private numberConfig(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private customerShippingPrice(dto: CreateQuoteDto, fallback: number): number {
    return this.numberConfig(dto.configSnapshot?.liveShippingAmount, fallback);
  }

  private yesNo(value: unknown): 'Yes' | 'No' {
    return value === true ? 'Yes' : 'No';
  }

  private isLiveSupplierPricingRequired(): boolean {
    return process.env.REQUIRE_LIVE_SUPPLIER_PRICING?.trim().toLowerCase() === 'true';
  }

  private configValue(key: string): string | undefined {
    const value = process.env[key]?.trim();
    return value && value !== 'not-configured' ? value : undefined;
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
