import { IsIn, IsOptional, IsString } from 'class-validator';

export class PrepareSupplierOrderDto {
  @IsOptional()
  @IsIn(['prepare', 'create'])
  mode?: 'prepare' | 'create';

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
