import type { CustomerTrackingStatus, PaymentStatus } from './order-detail-contract';

export type AdminOrderStatus =
  | CustomerTrackingStatus
  | 'awaiting_payment'
  | 'cancelled'
  | 'refunded';

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: AdminOrderStatus;
  paymentStatus?: PaymentStatus;
  destinationCountryIso2: string;
  totalPrice?: number;
  currency?: 'EUR' | 'USD';
  carrierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface AdminPricingRule {
  id?: string;
  code: string;
  name: string;
  conditions: Record<string, unknown>;
  formula: Record<string, unknown>;
  isActive?: boolean;
}

export interface AdminSupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  orderId?: string;
  subject: string;
  status: 'open' | 'pending_customer' | 'pending_admin' | 'resolved' | 'closed';
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  createdAt: string;
}

export interface UpdateAdminOrderStatusRequest {
  status: AdminOrderStatus;
  note?: string;
}

export interface AddSupplierReferenceRequest {
  externalManufacturingPartner: string;
  externalSupplierOrderId: string;
}

export interface UpdateShipmentRequest {
  carrierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: string;
}

export const adminApiContract = {
  orders: {
    method: 'GET',
    path: '/api/admin/orders',
    response: 'AdminOrderRow[]',
    access: 'Admin role only',
  },
  updateOrderStatus: {
    method: 'PATCH',
    path: '/api/admin/orders/:orderId/status',
    request: 'UpdateAdminOrderStatusRequest',
  },
  supplierReference: {
    method: 'POST',
    path: '/api/admin/orders/:orderId/supplier-reference',
    request: 'AddSupplierReferenceRequest',
    sensitivity: 'Admin-only supplier data. Never render on customer order pages.',
  },
  shipment: {
    method: 'PATCH',
    path: '/api/admin/orders/:orderId/shipment',
    request: 'UpdateShipmentRequest',
  },
  pricingRules: {
    method: 'GET',
    path: '/api/admin/pricing-rules',
    response: 'AdminPricingRule[] | PricingRuleSet',
  },
  upsertPricingRule: {
    method: 'POST',
    path: '/api/admin/pricing-rules',
    request: 'AdminPricingRule',
  },
  supportTickets: {
    method: 'GET',
    path: '/api/admin/support-tickets',
    response: 'AdminSupportTicket[]',
  },
  auditLogs: {
    method: 'GET',
    path: '/api/admin/audit-logs',
    response: 'AdminAuditLog[]',
  },
} as const;

export const adminOrderStatuses: AdminOrderStatus[] = [
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
  'cancelled',
  'refunded',
];

export const adminStatusLabels: Record<AdminOrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  supplier_order_pending: 'Supplier order pending',
  supplier_ordered: 'Supplier ordered',
  supplier_in_production: 'In production',
  received_at_france_hub: 'France hub',
  shipped_to_africa: 'Shipped to Africa',
  customs_processing: 'Customs',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};
