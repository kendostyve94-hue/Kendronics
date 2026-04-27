import { IsISO31661Alpha2, IsNumber, IsPhoneNumber, IsUUID, Min } from 'class-validator';

export class CreateMobileMoneyPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsNumber()
  @Min(0.5)
  amount!: number;

  @IsPhoneNumber()
  phoneNumber!: string;

  @IsISO31661Alpha2()
  countryIso2!: string;
}
