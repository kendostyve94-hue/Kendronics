import { DeliveryEstimate } from '../entities/delivery-estimate.entity';

export interface CarrierAdapter {
  getDeliveryEstimate(input: {
    countryIso2: string;
    logisticsZoneCode: string;
    shippingMode: 'economy' | 'standard' | 'express';
  }): Promise<DeliveryEstimate>;
}
