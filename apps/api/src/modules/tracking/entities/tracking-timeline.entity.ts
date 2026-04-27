import { OrderStatus } from '../../orders/entities/order.entity';
import { TrackingEvent } from './tracking-event.entity';

const publicTrackingStatuses = new Set<OrderStatus>([
  'paid',
  'supplier_order_pending',
  'supplier_ordered',
  'supplier_in_production',
  'received_at_france_hub',
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
