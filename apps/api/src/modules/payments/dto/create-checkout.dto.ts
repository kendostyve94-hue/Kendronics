import { IsOptional, IsUrl, IsUUID } from 'class-validator';

export class CreateCheckoutDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  amount?: number;

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}
