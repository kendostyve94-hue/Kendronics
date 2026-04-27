import { Injectable } from '@nestjs/common';
import { DeliveryEstimate } from '../entities/delivery-estimate.entity';
import { LogisticsZone } from '../entities/logistics-zone.entity';

@Injectable()
export class LogisticsRepository {
  async listZones(): Promise<LogisticsZone[]> {
    return [
      { id: 'north', code: 'AFRICA_NORTH', name: 'North Africa', isActive: true },
      { id: 'west', code: 'AFRICA_WEST', name: 'West Africa', isActive: true },
      { id: 'central', code: 'AFRICA_CENTRAL', name: 'Central Africa', isActive: true },
      { id: 'east', code: 'AFRICA_EAST', name: 'East Africa', isActive: true },
      { id: 'southern', code: 'AFRICA_SOUTHERN', name: 'Southern Africa', isActive: true },
      { id: 'islands', code: 'AFRICA_ISLANDS', name: 'African Island Markets', isActive: true },
    ];
  }

  async getDeliveryEstimate(
    countryIso2: string,
    logisticsZoneCode: string,
    shippingMode: 'economy' | 'standard' | 'express',
  ): Promise<DeliveryEstimate> {
    const zoneDays = this.zoneDeliveryDays()[logisticsZoneCode] ?? { min: 8, max: 16 };
    const modeAdjustment = this.shippingModeAdjustment()[shippingMode];
    const minDays = Math.max(2, zoneDays.min + modeAdjustment.min);
    const maxDays = Math.max(minDays, zoneDays.max + modeAdjustment.max);

    return {
      countryIso2,
      logisticsZoneCode,
      shippingMode,
      minDays,
      maxDays,
      estimatedDeliveryAt: addDays(new Date(), maxDays),
    };
  }

  private zoneDeliveryDays(): Record<string, { min: number; max: number }> {
    return {
      AFRICA_NORTH: { min: 5, max: 10 },
      AFRICA_WEST: { min: 7, max: 14 },
      AFRICA_CENTRAL: { min: 9, max: 18 },
      AFRICA_EAST: { min: 8, max: 16 },
      AFRICA_SOUTHERN: { min: 9, max: 17 },
      AFRICA_ISLANDS: { min: 10, max: 20 },
    };
  }

  private shippingModeAdjustment(): Record<
    'economy' | 'standard' | 'express',
    { min: number; max: number }
  > {
    return {
      economy: { min: 3, max: 5 },
      standard: { min: 0, max: 0 },
      express: { min: -3, max: -5 },
    };
  }
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
