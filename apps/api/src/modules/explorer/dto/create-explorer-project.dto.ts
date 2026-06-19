import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateExplorerProjectDraftDto {
  @IsIn(['free', 'paid'])
  projectType!: 'free' | 'paid';
}

export class UpdateExplorerProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(90)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(24)
  @MaxLength(360)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  repositoryUrl?: string;

  @IsOptional()
  @IsIn(['free', 'paid'])
  projectType?: 'free' | 'paid';

  @ValidateIf((dto: UpdateExplorerProjectDto) => dto.projectType === 'paid' || dto.priceCents !== undefined)
  @IsInt()
  @Min(100)
  @Max(10_000_000)
  priceCents?: number;

  @IsOptional()
  @IsIn(['EUR', 'USD', 'XAF'])
  currency?: string;

  @IsOptional()
  @IsIn(['CC-BY-4.0', 'CC-BY-SA-4.0', 'CERN-OHL-P-2.0', 'CERN-OHL-S-2.0', 'PROPRIETARY'])
  licenseCode?: string;

  @IsOptional()
  @IsArray()
  @IsIn(['download', 'modify', 'manufacture', 'republish', 'commercial-use'], { each: true })
  allowedUses?: string[];

  @IsOptional()
  @IsIn(['public', 'unlisted'])
  visibility?: string;

  @IsOptional()
  @IsObject()
  technicalDetails?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  documentation?: Record<string, unknown>;
}

export class AttachExplorerProjectAssetDto {
  @IsString()
  uploadId!: string;

  @IsIn(['cover', 'gallery', 'gerber', 'bom', 'cpl', 'schematic', 'firmware', 'source', 'documentation', 'video', 'other'])
  kind!: string;

  @IsIn(['public', 'protected'])
  visibility!: string;

  @IsString()
  @MaxLength(180)
  originalName!: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;
}
