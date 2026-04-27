export type PaymentProvider = 'stripe' | 'mobile_money';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  status: PaymentStatus;
  amount: number;
  currency: 'EUR';
  createdAt: Date;
  updatedAt: Date;
  succeededAt?: Date;
  failedAt?: Date;
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
