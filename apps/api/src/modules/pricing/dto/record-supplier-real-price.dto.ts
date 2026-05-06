import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordSupplierRealPriceDto {
  @IsNumber()
  @Min(0.01)
  realSupplierPrice!: number;

  @IsOptional()
  @IsString()
  supplierOrderId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
