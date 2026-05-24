export type PaymentProvider = 'stripe' | 'mobile_money';
export type PaymentStatus = 'pending' | 'processing' | 'authorized' | 'succeeded' | 'failed' | 'canceled' | 'expired' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerIntentId?: string;
  status: PaymentStatus;
  amount: number;
  currency: 'EUR';
  createdAt: Date;
  updatedAt: Date;
  authorizedAt?: Date;
  captureBefore?: Date;
  succeededAt?: Date;
  failedAt?: Date;
  canceledAt?: Date;
}

export interface PaymentEvent {
  id: string;
  paymentId?: string;
  provider: PaymentProvider;
  providerEventId: string;
  eventType: string;
  payload: unknown;
  processedAt?: Date;
  processingError?: string;
  createdAt: Date;
}
