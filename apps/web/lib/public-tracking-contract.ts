export const publicTrackingStatuses = [
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

export type PublicTrackingStatus = (typeof publicTrackingStatuses)[number];

export type PublicOrderStatus =
  | 'draft'
  | 'quoted'
  | 'awaiting_payment'
  | PublicTrackingStatus
  | 'cancelled'
  | 'refunded';

export interface PublicTrackingLookupRequest {
  orderId: string;
  email: string;
}

export interface PublicTrackingEvent {
  id: string;
  orderId: string;
  status: PublicTrackingStatus;
  title: string;
  description?: string;
  location?: string;
  occurredAt?: string;
}

export interface PublicTrackingTimeline {
  orderId: string;
  orderNumber: string;
  status: PublicOrderStatus;
  destinationCountryIso2: string;
  carrierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: string;
  events: PublicTrackingEvent[];
}

export const publicTrackingApiContract = {
  lookup: {
    method: 'POST',
    path: '/api/tracking/lookup',
    request: 'PublicTrackingLookupRequest',
    response: 'PublicTrackingTimeline',
    customerSafety: 'Public lookup exposes only status, public timeline, destination country, carrier, and tracking number.',
  },
} as const;

export const publicStatusLabels: Record<PublicOrderStatus, string> = {
  draft: 'Draft',
  quoted: 'Quoted',
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
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function isPublicTrackingStatus(status: string): status is PublicTrackingStatus {
  return publicTrackingStatuses.includes(status as PublicTrackingStatus);
}
