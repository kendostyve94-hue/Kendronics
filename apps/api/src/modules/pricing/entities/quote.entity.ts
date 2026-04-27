export interface PricingBreakdown {
  partnerManufacturingCost: number;
  partnerHandlingCost: number;
  ChinaToFranceLogistics: number;
  FranceProcessingFee: number;
  FranceToAfricaDelivery: number;
  customsRiskBuffer: number;
  paymentProcessingFee: number;
  KendronicsServiceFee: number;
  totalBeforeTax: number;
  taxesIfApplicable: number;
  finalTotal: number;
}

export interface Quote {
  id: string;
  userId: string;
  currency: 'EUR';
  validUntil: Date;
  breakdown: PricingBreakdown;
}
