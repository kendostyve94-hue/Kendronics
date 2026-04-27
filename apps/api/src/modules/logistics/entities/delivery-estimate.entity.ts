export interface DeliveryEstimate {
  countryIso2: string;
  logisticsZoneCode: string;
  shippingMode: 'economy' | 'standard' | 'express';
  minDays: number;
  maxDays: number;
  estimatedDeliveryAt: Date;
}
