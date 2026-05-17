export const customerTrackingStatuses = [
  'awaiting_payment',
  'paid',
  'supplier_order_pending',
  'supplier_ordered',
  'supplier_in_production',
  'china_3pl_received',
  'shipped_to_africa',
  'customs_processing',
  'out_for_delivery',
  'delivered',
] as const;

export type CustomerTrackingStatus = (typeof customerTrackingStatuses)[number];

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  status: CustomerTrackingStatus;
  paymentStatus: PaymentStatus;
  destinationCountryIso2: string;
  totalPrice: number;
  currency: 'EUR' | 'USD';
  estimatedDeliveryAt?: string;
  quoteSnapshot?: OrderQuoteSnapshot;
}

export interface OrderQuoteSnapshot {
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
  validUntil: string;
  createdAt: string;
}

export interface PcbSpecs {
  productType: string;
  layers: number;
  dimensions: string;
  quantity: number;
  baseMaterial: string;
  thickness: string;
  solderMaskColor: string;
  surfaceFinish: string;
  assemblyRequired: boolean;
}

export interface GerberFileInfo {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  validationStatus: 'validated' | 'pending_review' | 'rejected';
}

export interface PricingLineItem {
  label: string;
  amount: number;
}

export interface TrackingTimelineItem {
  id: string;
  status: CustomerTrackingStatus;
  title: string;
  description?: string;
  location?: string;
  occurredAt?: string;
}

export interface OrderDetailResponse {
  order: CustomerOrderSummary;
  pcbSpecs: PcbSpecs;
  gerberFile: GerberFileInfo;
  pricingBreakdown: PricingLineItem[];
  trackingTimeline: TrackingTimelineItem[];
}

export const orderDetailApiContract = {
  order: {
    method: 'GET',
    path: '/api/orders/:orderId',
    response: 'Customer-safe order summary plus quote snapshot fields when available.',
    customerSafety: 'Do not expose externalManufacturingPartner or externalSupplierOrderId.',
  },
  deleteOrder: {
    method: 'DELETE',
    path: '/api/orders/:orderId',
    response: '204 No Content when the authenticated customer owns the order.',
  },
  tracking: {
    method: 'GET',
    path: '/api/tracking/:orderId',
    response: 'Customer tracking events using public milestone statuses.',
  },
  support: {
    method: 'GET',
    path: '/contact?orderId=:orderId',
    response: 'Support form prefilled with the customer order reference.',
  },
} as const;

export const statusLabels: Record<CustomerTrackingStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  supplier_order_pending: 'Partner order pending',
  supplier_ordered: 'Partner order placed',
  supplier_in_production: 'In production',
  china_3pl_received: 'Received by China 3PL',
  shipped_to_africa: 'Shipped to Africa',
  customs_processing: 'Customs processing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

export function isCustomerTrackingStatus(status: string): status is CustomerTrackingStatus {
  return customerTrackingStatuses.includes(status as CustomerTrackingStatus);
}
