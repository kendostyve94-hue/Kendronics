import { Injectable } from '@nestjs/common';
import { AFRICAN_COUNTRIES } from '../data/african-countries.seed';
import { Country } from '../entities/country.entity';

@Injectable()
export class CountriesRepository {
  async findAfricanCountries(): Promise<Country[]> {
    return AFRICAN_COUNTRIES;
  }

  async findAfricanCountryByIso2(iso2: string): Promise<Country | null> {
    return AFRICAN_COUNTRIES.find((country) => country.iso2 === iso2.toUpperCase()) ?? null;
  }
}
