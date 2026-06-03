import { IsUrl, IsUUID } from 'class-validator';

export class CreatePaypalOrderDto {
  @IsUUID()
  orderId!: string;

  @IsUrl({ require_tld: false })
  returnUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}

