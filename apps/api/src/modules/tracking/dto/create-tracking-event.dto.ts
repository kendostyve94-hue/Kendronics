import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTrackingEventDto {
  @IsString()
  status!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
