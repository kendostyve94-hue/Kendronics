import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertCookieConsentDto {
  @IsBoolean()
  analytics!: boolean;

  @IsBoolean()
  preferences!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  version?: string;
}
