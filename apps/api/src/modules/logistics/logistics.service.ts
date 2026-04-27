import { Injectable, NotFoundException } from '@nestjs/common';
import { CountriesService } from '../countries/countries.service';
import { DeliveryEstimate } from './entities/delivery-estimate.entity';
import { LogisticsZone } from './entities/logistics-zone.entity';
import { LogisticsRepository } from './repositories/logistics.repository';

@Injectable()
export class LogisticsService {
  constructor(
    private readonly logisticsRepository: LogisticsRepository,
    private readonly countriesService: CountriesService,
  ) {}

  listZones(): Promise<LogisticsZone[]> {
    return this.logisticsRepository.listZones();
  }

  async getDeliveryEstimate(
    countryIso2: string,
    shippingMode: 'economy' | 'standard' | 'express',
  ): Promise<DeliveryEstimate> {
    const country = await this.countriesService.findAfricanCountryByIso2(countryIso2);
    if (!country || !country.isSupported) {
      throw new NotFoundException('African destination country is not supported.');
    }

    return this.logisticsRepository.getDeliveryEstimate(country.iso2, country.logisticsZoneCode, shippingMode);
  }
}
