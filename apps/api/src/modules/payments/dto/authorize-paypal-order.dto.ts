import { IsString } from 'class-validator';

export class AuthorizePaypalOrderDto {
  @IsString()
  paypalOrderId!: string;
}

