import { IsISO31661Alpha2, IsPhoneNumber, IsUUID } from 'class-validator';

export class CreateMobileMoneyPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsPhoneNumber()
  phoneNumber!: string;

  @IsISO31661Alpha2()
  countryIso2!: string;
}
