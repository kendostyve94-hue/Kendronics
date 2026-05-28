import { IsInt, Min } from 'class-validator';

export class UpdateOrderQuantityDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
