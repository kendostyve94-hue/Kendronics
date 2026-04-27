import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  quoteId!: string;

  @IsOptional()
  @IsUUID()
  shippingAddressId?: string;

  @IsString()
  destinationCountryIso2!: string;
}
