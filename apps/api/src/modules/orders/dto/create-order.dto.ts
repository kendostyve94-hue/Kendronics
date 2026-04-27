import { IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  quoteId!: string;

  @IsUUID()
  shippingAddressId!: string;

  @IsString()
  destinationCountryIso2!: string;
}
