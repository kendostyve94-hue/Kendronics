import { Module } from '@nestjs/common';
import { CountriesController } from './countries.controller';
import { CountriesRepository } from './repositories/countries.repository';
import { CountriesService } from './countries.service';

@Module({
  controllers: [CountriesController],
  providers: [CountriesService, CountriesRepository],
  exports: [CountriesService],
})
export class CountriesModule {}
