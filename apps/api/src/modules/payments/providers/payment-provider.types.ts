export interface CreateProviderCheckoutInput {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: 'EUR';
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePaypalOrderInput {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: 'EUR';
  returnUrl: string;
  cancelUrl: string;
}

export interface PaypalAuthorizationResult {
  paypalOrderId: string;
  authorizationId: string;
  captureBefore?: Date;
  raw: unknown;
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
  checkoutUrl?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface VerifiedStripePaymentEvent {
  id: string;
  type: string;
  paymentStatus: 'pending' | 'authorized' | 'succeeded' | 'failed' | 'canceled' | 'expired' | 'ignored';
  providerPaymentId: string;
  providerIntentId?: string;
  localPaymentId?: string;
  captureBefore?: Date;
  raw: unknown;
}

export interface VerifiedMobileMoneyPaymentEvent {
  providerEventId: string;
  providerReference: string;
  status: 'pending' | 'confirmed' | 'failed';
}
