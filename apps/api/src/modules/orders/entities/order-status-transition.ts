import { OrderStatus } from './order.entity';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'draft',
  'quoted',
  'awaiting_payment',
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
];

const TERMINAL_STATUSES: OrderStatus[] = ['cancelled', 'refunded'];

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['quoted', 'awaiting_payment', 'cancelled'],
  quoted: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['payment_authorized', 'cancelled'],
  payment_authorized: ['supplier_review_pending', 'supplier_files_rejected', 'paid', 'cancelled'],
  supplier_review_pending: ['supplier_files_rejected', 'paid', 'cancelled'],
  supplier_files_rejected: ['supplier_review_pending', 'cancelled'],
  paid: ['supplier_order_pending', 'cancelled', 'refunded'],
  supplier_order_pending: ['supplier_ordered', 'supplier_in_production', 'cancelled', 'refunded'],
  supplier_ordered: ['supplier_in_production', 'cancelled', 'refunded'],
  supplier_in_production: ['china_3pl_received', 'refunded'],
  china_3pl_received: ['shipped_to_africa', 'refunded'],
  shipped_to_africa: ['customs_processing', 'out_for_delivery', 'refunded'],
  customs_processing: ['out_for_delivery', 'refunded'],
  out_for_delivery: ['delivered', 'refunded'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) {
    return true;
  }

  if (TERMINAL_STATUSES.includes(from)) {
    return false;
  }

  if (TERMINAL_STATUSES.includes(to)) {
    return true;
  }

  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
