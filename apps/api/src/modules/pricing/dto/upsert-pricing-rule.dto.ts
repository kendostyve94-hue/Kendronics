import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertPricingRuleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsObject()
  conditions!: Record<string, unknown>;

  @IsObject()
  formula!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
