import { OrderStatus } from './order.entity';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
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

  const fromIndex = ORDER_STATUS_FLOW.indexOf(from);
  const toIndex = ORDER_STATUS_FLOW.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    return false;
  }

  return toIndex >= fromIndex;
}
