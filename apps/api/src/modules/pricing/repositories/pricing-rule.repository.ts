import { Injectable } from '@nestjs/common';
import { PricingRuleSet } from '../entities/pricing-rule.entity';

@Injectable()
export class PricingRuleRepository {
  async getActiveRules(): Promise<PricingRuleSet> {
    return {
      areaRate: 0.025,
      layerMultipliers: { 1: 0.8, 2: 1, 4: 1.8, 6: 2.7, 8: 3.6, 10: 4.5, 12: 5.4, 14: 6.3, 16: 7.2 },
      partnerHandlingFee: 4.5,
      chinaToFranceFee: 9,
      franceProcessingFee: 7.5,
      zoneBaseDeliveryFee: 22,
      marginRate: 0.22,
      minimumServiceFee: 12,
      paymentFeeRate: 0.029,
      paymentFixedFee: 0.3,
    };
  }
}
