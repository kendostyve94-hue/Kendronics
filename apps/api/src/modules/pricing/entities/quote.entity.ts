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
  productType: string;
  gerberFileId: string;
  bomFileId?: string | null;
  cplFileId?: string | null;
  layers: number;
  lengthMm: number;
  widthMm: number;
  quantity: number;
  destinationCountryIso2: string;
  shippingMode: string;
  currency: 'EUR';
  finalTotal: number;
  validUntil: Date;
  createdAt?: Date;
  breakdown: PricingBreakdown;
  configSnapshot?: Record<string, unknown> | null;
}
