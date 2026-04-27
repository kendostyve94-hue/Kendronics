import { IsIn, IsISO31661Alpha2 } from 'class-validator';

export class DeliveryEstimateQueryDto {
  @IsISO31661Alpha2()
  countryIso2!: string;

  @IsIn(['economy', 'standard', 'express'])
  shippingMode!: 'economy' | 'standard' | 'express';
}
