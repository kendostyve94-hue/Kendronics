import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePublicProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(420)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000000)
  bannerDataUrl?: string;
}
