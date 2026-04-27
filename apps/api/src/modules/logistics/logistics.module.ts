import { Module } from '@nestjs/common';
import { CountriesModule } from '../countries/countries.module';
import { LogisticsController } from './logistics.controller';
import { LogisticsRepository } from './repositories/logistics.repository';
import { LogisticsService } from './logistics.service';

@Module({
  imports: [CountriesModule],
  controllers: [LogisticsController],
  providers: [LogisticsService, LogisticsRepository],
  exports: [LogisticsService],
})
export class LogisticsModule {}
