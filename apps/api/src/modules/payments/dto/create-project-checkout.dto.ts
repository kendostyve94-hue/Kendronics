import { IsUrl, IsUUID } from 'class-validator';

export class CreateProjectCheckoutDto {
  @IsUUID()
  purchaseId!: string;

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}
