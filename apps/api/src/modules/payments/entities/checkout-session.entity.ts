export interface CheckoutSession {
  paymentId: string;
  provider: 'stripe';
  providerSessionId: string;
  checkoutUrl: string;
  status: 'pending';
}
