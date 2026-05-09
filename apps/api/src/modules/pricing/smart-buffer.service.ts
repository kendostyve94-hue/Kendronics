import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

const FORMULA_VERSION = 'smart-buffer-v1';
const MIN_BUFFER = 1.08;
const MAX_BUFFER = 1.7;

export interface SmartBufferQuoteInput {
  dto: CreateQuoteDto;
  supplierEstimatedPrice: number;
  shippingPrice: number;
  supplier?: string;
}

export interface SmartBufferResult {
  supplier: string;
  supplierEstimatedPrice: number;
  bufferUsed: number;
  serviceFee: number;
  pcbClientPrice: number;
  shippingPrice: number;
  totalClientPrice: number;
  bucketKey: string;
  bucket: BufferBucketDescriptor;
  riskScore: number;
  confidence: 'low' | 'medium' | 'high';
  formulaVersion: typeof FORMULA_VERSION;
  reasons: BufferReason[];
  inputSnapshot: Record<string, unknown>;
}

interface BufferBucketDescriptor {
  layersRange: string;
  priceRange: string;
  finish: string;
  complexity: 'low' | 'medium' | 'high';
  quantityRange: string;
}

interface BufferReason {
  code: string;
  label: string;
  adjustment: number;
}

@Injectable()
export class SmartBufferService {
  constructor(private readonly prisma: PrismaService) {}

  async priceQuote(input: SmartBufferQuoteInput): Promise<SmartBufferResult> {
    const supplierEstimatedPrice = roundMoney(Math.max(0.01, input.supplierEstimatedPrice));
    const shippingPrice = roundMoney(Math.max(0, input.shippingPrice));
    const bucket = this.describeBucket(input.dto, supplierEstimatedPrice);
    const bucketKey = this.bucketKey(bucket);
    const historicalBucket = await this.prisma.bufferBucket.findUnique({ where: { bucketKey } });
    const reasons = this.ruleReasons(input.dto, supplierEstimatedPrice, bucket);
    const ruleBuffer = clamp(
      1.1 + reasons.reduce((total, reason) => total + reason.adjustment, 0),
      MIN_BUFFER,
      MAX_BUFFER,
    );
    const historicalCorrection = historicalBucket ? Number(historicalBucket.currentBuffer) - ruleBuffer : 0;
    const bufferUsed = clamp(ruleBuffer + historicalCorrection, MIN_BUFFER, MAX_BUFFER);
    const serviceFee = this.serviceFee(supplierEstimatedPrice);
    const pcbClientPrice = roundMoney(supplierEstimatedPrice * bufferUsed + serviceFee);
    const totalClientPrice = roundMoney(pcbClientPrice + shippingPrice);
    const riskScore = roundRatio((bufferUsed - 1) / (MAX_BUFFER - 1));
    const confidence = this.confidence(historicalBucket?.sampleCount ?? 0);

    await this.prisma.bufferBucket.upsert({
      where: { bucketKey },
      create: {
        bucketKey,
        ...bucket,
        currentBuffer: toDecimal(bufferUsed),
        minBuffer: toDecimal(MIN_BUFFER),
        maxBuffer: toDecimal(MAX_BUFFER),
        confidence,
      },
      update: {
        layersRange: bucket.layersRange,
        priceRange: bucket.priceRange,
        finish: bucket.finish,
        complexity: bucket.complexity,
        quantityRange: bucket.quantityRange,
        currentBuffer: toDecimal(bufferUsed),
        confidence,
      },
    });

    return {
      supplier: input.supplier ?? 'jlcpcb',
      supplierEstimatedPrice,
      bufferUsed: roundRatio(bufferUsed),
      serviceFee,
      pcbClientPrice,
      shippingPrice,
      totalClientPrice,
      bucketKey,
      bucket,
      riskScore,
      confidence,
      formulaVersion: FORMULA_VERSION,
      reasons,
      inputSnapshot: this.inputSnapshot(input.dto, supplierEstimatedPrice, shippingPrice),
    };
  }

  async createSnapshot(quoteId: string, result: SmartBufferResult): Promise<void> {
    await this.prisma.pricingSnapshot.create({
      data: {
        quoteId,
        supplier: result.supplier,
        supplierEstimatedPrice: toDecimal(result.supplierEstimatedPrice),
        bufferUsed: toDecimal(result.bufferUsed),
        serviceFee: toDecimal(result.serviceFee),
        pcbClientPrice: toDecimal(result.pcbClientPrice),
        shippingPrice: toDecimal(result.shippingPrice),
        totalClientPrice: toDecimal(result.totalClientPrice),
        currency: 'EUR',
        bucketKey: result.bucketKey,
        riskScore: toDecimal(result.riskScore),
        confidence: result.confidence,
        formulaVersion: result.formulaVersion,
        reasons: result.reasons as unknown as Prisma.InputJsonArray,
        inputSnapshot: result.inputSnapshot as Prisma.InputJsonObject,
      },
    });
  }

  async recordRealSupplierPrice(quoteId: string, realSupplierPrice: number): Promise<void> {
    const snapshot = await this.prisma.pricingSnapshot.update({
      where: { quoteId },
      data: { supplierRealPrice: toDecimal(roundMoney(realSupplierPrice)) },
    });
    const bucket = await this.prisma.bufferBucket.findUnique({ where: { bucketKey: snapshot.bucketKey } });
    if (!bucket) return;

    const estimated = Number(snapshot.supplierEstimatedPrice);
    if (estimated <= 0) return;

    const errorRate = (roundMoney(realSupplierPrice) - estimated) / estimated;
    const previousBuffer = Number(bucket.currentBuffer);
    const learningRate = errorRate > 0 ? 0.35 : 0.1;
    const nextBuffer = clamp(previousBuffer + errorRate * learningRate, Number(bucket.minBuffer), Number(bucket.maxBuffer));
    const averageErrorRate = (Number(bucket.averageErrorRate) * bucket.sampleCount + errorRate) / (bucket.sampleCount + 1);
    const confidence = this.confidence(bucket.sampleCount + 1);
    const riskFlag = errorRate > 0.1;

    await this.prisma.$transaction([
      this.prisma.bufferBucket.update({
        where: { id: bucket.id },
        data: {
          currentBuffer: toDecimal(nextBuffer),
          averageErrorRate: toDecimal(averageErrorRate),
          sampleCount: { increment: 1 },
          confidence,
          riskFlag,
          lastErrorRate: toDecimal(errorRate),
          lastAdjustedAt: new Date(),
        },
      }),
      this.prisma.bufferAdjustment.create({
        data: {
          bucketId: bucket.id,
          pricingSnapshotId: snapshot.id,
          quoteId,
          previousBuffer: toDecimal(previousBuffer),
          nextBuffer: toDecimal(nextBuffer),
          errorRate: toDecimal(errorRate),
          direction: errorRate > 0 ? 'increase' : errorRate < 0 ? 'decrease' : 'hold',
          reason: 'supplier_real_price_recorded',
          metadata: {
            estimatedSupplierPrice: estimated,
            realSupplierPrice: roundMoney(realSupplierPrice),
            learningRate,
            formulaVersion: FORMULA_VERSION,
          },
        },
      }),
    ]);
  }

  private ruleReasons(dto: CreateQuoteDto, supplierPrice: number, bucket: BufferBucketDescriptor): BufferReason[] {
    const config = dto.configSnapshot ?? {};
    const reasons: BufferReason[] = [];

    if (supplierPrice < 10) reasons.push(reason('low_supplier_price', 'Small supplier quote needs stronger protection.', 0.25));
    else if (supplierPrice < 30) reasons.push(reason('modest_supplier_price', 'Modest quote leaves little error room.', 0.15));
    else if (supplierPrice < 100) reasons.push(reason('mid_supplier_price', 'Mid-size quote keeps moderate protection.', 0.08));
    else reasons.push(reason('large_supplier_price', 'Large quote uses lower percentage protection.', 0.04));

    if (dto.layers >= 6) reasons.push(reason('six_plus_layers', 'Six or more layers increase supplier variance.', 0.15));
    else if (dto.layers >= 4) reasons.push(reason('four_layers', 'Four-layer boards carry additional review risk.', 0.08));

    if (this.stringConfig(config.surfaceFinish, '').toLowerCase().includes('enig')) {
      reasons.push(reason('enig_finish', 'ENIG usually has a higher supplier variance.', 0.06));
    }
    if (this.booleanConfig(config.blindBuriedVias) || this.booleanConfig(config.viaInPad)) {
      reasons.push(reason('advanced_vias', 'Advanced vias often require supplier confirmation.', 0.08));
    }
    if (this.booleanConfig(config.castellatedHoles) || this.booleanConfig(config.edgePlating)) {
      reasons.push(reason('edge_processes', 'Edge plating or castellations add fabrication risk.', 0.05));
    }
    if (this.booleanConfig(config.hasSlots)) {
      reasons.push(reason('slots_detected', 'Slots detected in Gerber drill data add routing risk.', 0.05));
    }
    if (bucket.complexity === 'high') reasons.push(reason('high_complexity', 'High complexity bucket adds extra protection.', 0.1));
    else if (bucket.complexity === 'medium') reasons.push(reason('medium_complexity', 'Medium complexity bucket adds moderate protection.', 0.05));

    const parserConfidence = this.numberConfig(config.parserConfidence, 1);
    if (parserConfidence < 0.8) reasons.push(reason('low_parser_confidence', 'Low parser confidence requires a safety buffer.', 0.1));

    return reasons;
  }

  private describeBucket(dto: CreateQuoteDto, supplierPrice: number): BufferBucketDescriptor {
    return {
      layersRange: dto.layers <= 2 ? '1-2' : dto.layers <= 4 ? '3-4' : dto.layers <= 6 ? '5-6' : '7+',
      priceRange: supplierPrice < 10 ? '0-10' : supplierPrice < 30 ? '10-30' : supplierPrice < 100 ? '30-100' : '100+',
      finish: this.stringConfig(dto.configSnapshot?.surfaceFinish, 'standard').toLowerCase().includes('enig') ? 'enig' : 'standard',
      complexity: this.complexity(dto),
      quantityRange: dto.quantity <= 10 ? '1-10' : dto.quantity <= 50 ? '11-50' : dto.quantity <= 250 ? '51-250' : '251+',
    };
  }

  private bucketKey(bucket: BufferBucketDescriptor): string {
    return [
      `layers:${bucket.layersRange}`,
      `price:${bucket.priceRange}`,
      `finish:${bucket.finish}`,
      `complexity:${bucket.complexity}`,
      `qty:${bucket.quantityRange}`,
    ].join('|');
  }

  private complexity(dto: CreateQuoteDto): BufferBucketDescriptor['complexity'] {
    const config = dto.configSnapshot ?? {};
    if (config.gerberComplexity === 'high' || config.gerberComplexity === 'medium' || config.gerberComplexity === 'low') {
      return config.gerberComplexity;
    }
    const specialCount = [
      config.impedanceControl,
      config.goldFingers,
      config.castellatedHoles,
      config.edgePlating,
      config.blindBuriedVias,
      config.viaInPad,
      config.peelableMask,
      config.carbonInk,
      config.countersink,
      config.pressFitHoles,
    ].filter(Boolean).length;

    if (dto.layers >= 6 || specialCount >= 3 || ['advanced_pcb', 'fpc_rigid_flex', 'pcb_assembly', 'cnc_3d'].includes(dto.productType)) return 'high';
    if (dto.layers >= 4 || specialCount >= 1 || dto.productType === 'smt_stencil' || this.stringConfig(config.surfaceFinish, '').toLowerCase().includes('enig')) return 'medium';
    return 'low';
  }

  private serviceFee(supplierPrice: number): number {
    if (supplierPrice < 10) return 3;
    if (supplierPrice < 50) return 4;
    return 5;
  }

  private confidence(sampleCount: number): SmartBufferResult['confidence'] {
    if (sampleCount >= 20) return 'high';
    if (sampleCount >= 5) return 'medium';
    return 'low';
  }

  private inputSnapshot(dto: CreateQuoteDto, supplierEstimatedPrice: number, shippingPrice: number): Record<string, unknown> {
    return {
      productType: dto.productType,
      layers: dto.layers,
      lengthMm: dto.lengthMm,
      widthMm: dto.widthMm,
      quantity: dto.quantity,
      destinationCountryIso2: dto.destinationCountryIso2,
      shippingMode: dto.shippingMode,
      supplierEstimatedPrice,
      shippingPrice,
      configSnapshot: dto.configSnapshot ?? null,
    };
  }

  private stringConfig(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }

  private numberConfig(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private booleanConfig(value: unknown): boolean {
    return value === true;
  }
}

function reason(code: string, label: string, adjustment: number): BufferReason {
  return { code, label, adjustment };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundRatio(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(roundRatio(value));
}
