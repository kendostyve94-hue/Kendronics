import { Module } from '@nestjs/common';
import { SupportModule } from '../support/support.module';
import { MondayController } from './monday.controller';
import { MondayApiService } from './monday-api.service';
import { MondayConfigService } from './monday-config.service';
import { MondayMapperService } from './monday-mapper.service';
import { MondaySyncService } from './monday-sync.service';
import { MondayWebhookService } from './monday-webhook.service';

@Module({
  imports: [SupportModule],
  controllers: [MondayController],
  providers: [MondayApiService, MondayConfigService, MondayMapperService, MondaySyncService, MondayWebhookService],
  exports: [MondayApiService, MondayConfigService, MondayMapperService, MondaySyncService, MondayWebhookService],
})
export class MondayModule {}
