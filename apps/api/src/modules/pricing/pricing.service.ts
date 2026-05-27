import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { PreviewQuoteDto } from './dto/preview-quote.dto';
import { PricingBreakdown, Quote } from './entities/quote.entity';
import { SmartBufferResult, SmartBufferService } from './smart-buffer.service';
import { SupplierPricingService } from './suppliers/supplier-pricing.service';

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smartBuffer: SmartBufferService,
    private readonly uploadsService: UploadsService,
    private readonly supplierPricing: SupplierPricingService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createQuote(userId: string, dto: CreateQuoteDto): Promise<Quote> {
    const effectiveDto = await this.applyGerberAnalysis(userId, dto);

    if (effectiveDto.productType === 'pcb_assembly' && (!effectiveDto.bomFileId || !effectiveDto.cplFileId)) {
      throw new BadRequestException('PCB assembly requires BOM and CPL files.');
    }

    const supplierQuote = await this.supplierPricing.getBestQuote(effectiveDto);
    const smartPrice = await this.smartBuffer.priceQuote({
      dto: effectiveDto,
      supplier: supplierQuote.supplier,
      supplierEstimatedPrice: supplierQuote.manufacturingPrice,
      shippingPrice: this.customerShippingPrice(effectiveDto, supplierQuote.shippingPrice),
    });
    const quote = await this.persistQuote(userId, effectiveDto, this.toSmartBufferBreakdown(smartPrice, supplierQuote), smartPrice);
    await this.notificationsService.create({
      userId,
      type: 'quote.created',
      title: 'Devis cree',
      body: `Votre devis PCB de ${quote.finalTotal.toFixed(2)} ${quote.currency} est pret et valable pendant 2 heures.`,
    });
    return quote;
  }

  async previewQuote(dto: PreviewQuoteDto, userId?: string): Promise<PricingBreakdown> {
    const effectiveDto = await this.applyOptionalGerberAnalysis(dto, userId);
    const gerberFileId = effectiveDto.gerberFileId ?? crypto.randomUUID();
    const supplierDto = {
      ...effectiveDto,
      gerberFileId,
    };
    const supplierQuote = await this.supplierPricing.getBestQuote({
      ...supplierDto,
    });
    const smartPrice = await this.smartBuffer.priceQuote({
      dto: supplierDto,
      supplier: supplierQuote.supplier,
      supplierEstimatedPrice: supplierQuote.manufacturingPrice,
      shippingPrice: this.customerShippingPrice(supplierDto, supplierQuote.shippingPrice),
    });

    return this.toSmartBufferBreakdown(smartPrice, supplierQuote);
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

  private async applyOptionalGerberAnalysis(dto: PreviewQuoteDto, userId?: string): Promise<PreviewQuoteDto> {
    if (!dto.gerberFileId || !userId) return dto;

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

  private toSmartBufferBreakdown(result: SmartBufferResult, supplierQuote?: { leadTimeDays?: number; buildOptions?: PricingBreakdown['buildOptions'] }): PricingBreakdown {
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
      supplierLeadTimeDays: supplierQuote?.leadTimeDays,
      productionBuildDays: supplierQuote?.leadTimeDays,
      buildOptions: supplierQuote?.buildOptions,
    };
  }

  private numberConfig(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private customerShippingPrice(dto: Pick<CreateQuoteDto, 'configSnapshot'>, fallback: number): number {
    return this.numberConfig(dto.configSnapshot?.liveShippingAmount, fallback);
  }

}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
