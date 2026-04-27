import { IsEmail, IsString } from 'class-validator';

export class PublicTrackingLookupDto {
  @IsString()
  orderId!: string;

  @IsEmail()
  email!: string;
}
