export const customerTrackingStatuses = [
  'awaiting_payment',
  'paid',
  'supplier_order_pending',
  'supplier_ordered',
  'supplier_in_production',
  'received_at_france_hub',
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
  tracking: {
    method: 'GET',
    path: '/api/tracking/:orderId',
    response: 'Customer tracking events using public milestone statuses.',
  },
  support: {
    method: 'GET',
    path: '/support?orderId=:orderId',
    response: 'Support form prefilled with the customer order reference.',
  },
} as const;

export const statusLabels: Record<CustomerTrackingStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  supplier_order_pending: 'Partner order pending',
  supplier_ordered: 'Partner order placed',
  supplier_in_production: 'In production',
  received_at_france_hub: 'Received at France hub',
  shipped_to_africa: 'Shipped to Africa',
  customs_processing: 'Customs processing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

export function isCustomerTrackingStatus(status: string): status is CustomerTrackingStatus {
  return customerTrackingStatuses.includes(status as CustomerTrackingStatus);
}
