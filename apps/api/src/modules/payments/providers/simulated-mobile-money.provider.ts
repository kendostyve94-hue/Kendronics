import { Injectable } from '@nestjs/common';
import { MobileMoneyProvider } from './mobile-money.provider';
import { MobileMoneyInitiationInput, MobileMoneyInitiationResult } from './payment-provider.types';

@Injectable()
export class SimulatedMobileMoneyProvider extends MobileMoneyProvider {
  async initiate(input: MobileMoneyInitiationInput): Promise<MobileMoneyInitiationResult> {
    return {
      providerReference: `sim_mm_${input.orderId}_${Date.now()}`,
      status: 'pending',
    };
  }
}
