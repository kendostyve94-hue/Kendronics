import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { PricingBreakdown, Quote } from './entities/quote.entity';
import { PricingRuleRepository } from './repositories/pricing-rule.repository';

@Injectable()
export class PricingService {
  constructor(
    private readonly pricingRules: PricingRuleRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createQuote(userId: string, dto: CreateQuoteDto): Promise<Quote> {
    if (dto.productType === 'pcb_assembly' && (!dto.bomFileId || !dto.cplFileId)) {
      throw new BadRequestException('PCB assembly requires BOM and CPL files.');
    }

    const rules = await this.pricingRules.getActiveRules();
    const layerMultiplier = rules.layerMultipliers[dto.layers];
    if (!layerMultiplier) {
      throw new BadRequestException('Unsupported PCB layer count.');
    }

    const areaCm2 = (dto.lengthMm * dto.widthMm) / 100;
    const manufacturing = areaCm2 * dto.quantity * rules.areaRate * layerMultiplier;
    const logistics = rules.zoneBaseDeliveryFee;
    const serviceFee = Math.max(rules.minimumServiceFee, manufacturing * rules.marginRate);
    const subtotalBeforePayment =
      manufacturing +
      rules.partnerHandlingFee +
      rules.chinaToFranceFee +
      rules.franceProcessingFee +
      logistics +
      serviceFee;
    const paymentFee = subtotalBeforePayment * rules.paymentFeeRate + rules.paymentFixedFee;
    const finalTotal = subtotalBeforePayment + paymentFee;

    const breakdown: PricingBreakdown = {
      partnerManufacturingCost: round(manufacturing),
      partnerHandlingCost: rules.partnerHandlingFee,
      ChinaToFranceLogistics: rules.chinaToFranceFee,
      FranceProcessingFee: rules.franceProcessingFee,
      FranceToAfricaDelivery: round(logistics),
      customsRiskBuffer: 0,
      paymentProcessingFee: round(paymentFee),
      KendronicsServiceFee: round(serviceFee),
      totalBeforeTax: round(finalTotal),
      taxesIfApplicable: 0,
      finalTotal: round(finalTotal),
    };
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
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
