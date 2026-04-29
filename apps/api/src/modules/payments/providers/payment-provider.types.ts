export interface CreateProviderCheckoutInput {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: 'EUR';
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface MobileMoneyInitiationInput {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: 'EUR';
  phoneNumber: string;
  countryIso2: string;
}

export interface MobileMoneyInitiationResult {
  providerReference: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface VerifiedStripePaymentEvent {
  id: string;
  type: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'ignored';
  providerPaymentId: string;
  raw: unknown;
}
