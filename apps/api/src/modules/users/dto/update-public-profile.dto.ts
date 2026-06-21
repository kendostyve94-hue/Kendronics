import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePublicProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(420)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1800000)
  bannerDataUrl?: string;
}
