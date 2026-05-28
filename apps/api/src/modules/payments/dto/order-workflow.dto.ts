import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReuploadCorrectedFilesDto {
  @IsOptional()
  @IsString()
  gerberFileId?: string;

  @IsOptional()
  @IsString()
  bomFileId?: string;

  @IsOptional()
  @IsString()
  cplFileId?: string;
}

export class SupplierReviewResultDto {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  externalReviewId?: string;
}
