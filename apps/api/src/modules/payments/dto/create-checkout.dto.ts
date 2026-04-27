import { IsNumber, IsUrl, IsUUID, Min } from 'class-validator';

export class CreateCheckoutDto {
  @IsUUID()
  orderId!: string;

  @IsNumber()
  @Min(0.5)
  amount!: number;

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}
