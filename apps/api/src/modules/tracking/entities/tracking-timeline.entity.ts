import { OrderStatus } from '../../orders/entities/order.entity';
import { TrackingEvent } from './tracking-event.entity';

const publicTrackingStatuses = new Set<OrderStatus>([
  'payment_authorized',
  'supplier_review_pending',
  'supplier_files_rejected',
  'paid',
  'supplier_order_pending',
  'supplier_ordered',
  'supplier_in_production',
  'china_3pl_received',
  'shipped_to_africa',
  'customs_processing',
  'out_for_delivery',
  'delivered',
]);

export interface TrackingTimeline {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  destinationCountryIso2: string;
  carrierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: Date;
  events: TrackingEvent[];
}

export function isPublicTrackingStatus(status: string): status is OrderStatus {
  return publicTrackingStatuses.has(status as OrderStatus);
}
