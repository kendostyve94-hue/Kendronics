import { IsEmail, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAccountProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(750000)
  avatarDataUrl?: string;

  @IsOptional()
  @IsObject()
  profileDetails?: Record<string, unknown>;
}

export class UpdateAccountAddressDto {
  @IsObject()
  address!: Record<string, unknown>;
}
