import { IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateQuoteDto {
  @IsIn(['standard_pcb', 'advanced_pcb', 'fpc_rigid_flex', 'pcb_assembly', 'smt_stencil', 'cnc_3d'])
  productType!: string;

  @IsUUID()
  gerberFileId!: string;

  @IsOptional()
  @IsUUID()
  bomFileId?: string;

  @IsOptional()
  @IsUUID()
  cplFileId?: string;

  @IsInt()
  @Min(1)
  layers!: number;

  @IsNumber()
  @Min(1)
  lengthMm!: number;

  @IsNumber()
  @Min(1)
  widthMm!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  destinationCountryIso2!: string;

  @IsIn(['economy', 'standard', 'express'])
  shippingMode!: string;

  @IsOptional()
  @IsObject()
  configSnapshot?: Record<string, unknown>;
}
