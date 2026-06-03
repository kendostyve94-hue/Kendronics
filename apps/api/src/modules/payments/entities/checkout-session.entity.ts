export interface CheckoutSession {
  paymentId: string;
  provider: 'stripe' | 'paypal';
  providerSessionId: string;
  checkoutUrl: string;
  status: 'pending';
}
