import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Quote } from './entities/quote.entity';
import { PricingRuleRepository } from './repositories/pricing-rule.repository';

@Injectable()
export class PricingService {
  constructor(private readonly pricingRules: PricingRuleRepository) {}

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

    return {
      id: crypto.randomUUID(),
      userId,
      currency: 'EUR',
      validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
      breakdown: {
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
      },
    };
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
