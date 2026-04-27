import { Injectable } from '@nestjs/common';
import { Country } from './entities/country.entity';
import { CountriesRepository } from './repositories/countries.repository';

@Injectable()
export class CountriesService {
  constructor(private readonly countriesRepository: CountriesRepository) {}

  findAfricanCountries(): Promise<Country[]> {
    return this.countriesRepository.findAfricanCountries();
  }

  findAfricanCountryByIso2(iso2: string): Promise<Country | null> {
    return this.countriesRepository.findAfricanCountryByIso2(iso2);
  }
}
