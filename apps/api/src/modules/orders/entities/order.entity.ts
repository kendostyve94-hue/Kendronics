export type OrderStatus =
  | 'draft'
  | 'quoted'
  | 'awaiting_payment'
  | 'payment_authorized'
  | 'supplier_review_pending'
  | 'supplier_files_rejected'
  | 'paid'
  | 'supplier_order_pending'
  | 'supplier_ordered'
  | 'supplier_in_production'
  | 'china_3pl_received'
  | 'shipped_to_africa'
  | 'customs_processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  quoteId: string;
  destinationCountryIso2: string;
  status: OrderStatus;
  totalPrice?: number;
  currency?: 'EUR';
  paymentStatus?: 'pending' | 'authorized' | 'paid' | 'failed' | 'canceled' | 'expired' | 'refunded';
  externalManufacturingPartner?: string;
  externalSupplierOrderId?: string;
  carrierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: Date;
  paidAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  quoteSnapshot?: {
    productType: string;
    gerberFileId: string;
    layers: number;
    lengthMm: number;
    widthMm: number;
    quantity: number;
    shippingMode: string;
    finalTotal: number;
    currency: 'EUR';
    breakdown: Record<string, number>;
    configSnapshot?: Record<string, unknown> | null;
    validUntil: Date;
    createdAt: Date;
  };
}
