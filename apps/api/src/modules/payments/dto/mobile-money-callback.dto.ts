import { IsIn, IsString } from 'class-validator';

export class MobileMoneyCallbackDto {
  @IsString()
  providerEventId!: string;

  @IsString()
  providerReference!: string;

  @IsIn(['pending', 'confirmed', 'failed'])
  status!: 'pending' | 'confirmed' | 'failed';
}
