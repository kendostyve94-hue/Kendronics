export type OrderStatus =
  | 'draft'
  | 'quoted'
  | 'awaiting_payment'
  | 'paid'
  | 'supplier_order_pending'
  | 'supplier_ordered'
  | 'supplier_in_production'
  | 'received_at_france_hub'
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
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  externalManufacturingPartner?: string;
  externalSupplierOrderId?: string;
  carrierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: Date;
  paidAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
