import { Module } from '@nestjs/common';
import { MondayApiService } from './monday-api.service';
import { MondayConfigService } from './monday-config.service';
import { MondayMapperService } from './monday-mapper.service';
import { MondaySyncService } from './monday-sync.service';

@Module({
  providers: [MondayApiService, MondayConfigService, MondayMapperService, MondaySyncService],
  exports: [MondayApiService, MondayConfigService, MondayMapperService, MondaySyncService],
})
export class MondayModule {}
