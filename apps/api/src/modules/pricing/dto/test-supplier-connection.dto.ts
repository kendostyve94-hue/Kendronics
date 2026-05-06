import { IsIn, IsOptional } from 'class-validator';

export class TestSupplierConnectionDto {
  @IsOptional()
  @IsIn(['pcbway', 'jlcpcb'])
  supplier?: 'pcbway' | 'jlcpcb';
}
