export interface Country {
  id: string;
  iso2: string;
  iso3: string;
  name: string;
  region: 'Africa';
  subregion?: string;
  logisticsZoneCode: string;
  currencyCode?: string;
  isSupported: boolean;
}
