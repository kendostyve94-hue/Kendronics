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
  supplier?: string;
  supplierEstimatedPrice?: number;
  pcbClientPrice?: number;
  smartBufferMultiplier?: number;
  smartBufferRiskScore?: number;
  smartBufferConfidence?: 'low' | 'medium' | 'high';
  smartBufferBucketKey?: string;
  smartBufferFormulaVersion?: string;
  smartBufferReasons?: Array<{ code: string; label: string; adjustment: number }>;
  supplierLeadTimeDays?: number;
  productionBuildDays?: number;
  buildOptions?: Array<{
    id: string;
    label: string;
    buildDays: number;
    price: number;
    currency: 'EUR' | 'USD';
    speed: 'standard' | 'express_24h' | 'pcba_24h';
    source: string;
  }>;
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
