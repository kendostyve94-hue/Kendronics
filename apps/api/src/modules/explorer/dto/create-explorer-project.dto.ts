import { IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateExplorerProjectDto {
  @IsString()
  @MinLength(4)
  @MaxLength(90)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  category!: string;

  @IsString()
  @MinLength(24)
  @MaxLength(360)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  attachmentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  attachmentType?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  repositoryUrl?: string;
}
