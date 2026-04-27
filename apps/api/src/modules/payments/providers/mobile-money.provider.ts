import { MobileMoneyInitiationInput, MobileMoneyInitiationResult } from './payment-provider.types';

export abstract class MobileMoneyProvider {
  abstract initiate(input: MobileMoneyInitiationInput): Promise<MobileMoneyInitiationResult>;
}
