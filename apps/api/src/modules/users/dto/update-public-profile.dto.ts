import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdatePublicProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(18)
  @Matches(/^[A-Z0-9_-]+$/)
  promoCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(420)
  description?: string;
}
