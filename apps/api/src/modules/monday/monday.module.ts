import { Module } from '@nestjs/common';
import { MondaySyncService } from './monday-sync.service';

@Module({
  providers: [MondaySyncService],
  exports: [MondaySyncService],
})
export class MondayModule {}
