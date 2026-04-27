import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MobileMoneyProvider } from './mobile-money.provider';
import { MobileMoneyInitiationInput, MobileMoneyInitiationResult } from './payment-provider.types';

@Injectable()
export class SimulatedMobileMoneyProvider extends MobileMoneyProvider {
  async initiate(input: MobileMoneyInitiationInput): Promise<MobileMoneyInitiationResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException('Mobile Money is not configured for production payments.');
    }

    return {
      providerReference: `sim_mm_${input.orderId}_${Date.now()}`,
      status: 'pending',
    };
  }
}
