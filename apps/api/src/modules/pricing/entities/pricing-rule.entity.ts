export interface PricingRuleSet {
  areaRate: number;
  layerMultipliers: Record<number, number>;
  partnerHandlingFee: number;
  chinaToFranceFee: number;
  franceProcessingFee: number;
  zoneBaseDeliveryFee: number;
  marginRate: number;
  minimumServiceFee: number;
  paymentFeeRate: number;
  paymentFixedFee: number;
}
