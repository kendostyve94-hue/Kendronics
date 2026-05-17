import type { CustomerTrackingStatus, PaymentStatus } from './order-detail-contract';

export type AdminOrderStatus =
  | CustomerTrackingStatus
  | 'awaiting_payment'
  | 'cancelled'
  | 'refunded';

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  userId: string;
  quoteId: string;
  status: AdminOrderStatus;
  paymentStatus?: PaymentStatus;
  destinationCountryIso2: string;
  totalPrice?: number;
  currency?: 'EUR' | 'USD';
  externalManufacturingPartner?: string;
  externalSupplierOrderId?: string;
  carrierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: string;
  paidAt?: string;
  createdAt: string;
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
    validUntil: string;
    createdAt: string;
  };
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
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminAccessUser {
  id: string;
  accessId: string;
  email: string;
  professionalEmail: string;
  fullName: string;
  roles: string[];
  accessRoles: string[];
  status: 'active' | 'pending_setup' | 'expired' | 'locked' | 'disabled';
  personalCodeExpiresAt?: string;
  lockedUntil?: string;
  lastVerifiedAt?: string;
  lastFailedAt?: string;
  createdAt: string;
}

export interface AddAdminUserRequest {
  email: string;
  professionalEmail: string;
  accessRoles?: string[];
}

export interface StartAdminCodeRequest {
  adminEmail: string;
}

export interface VerifyAdminCodeRequest {
  adminEmail: string;
  code: string;
}

export interface SetupAdminCodeRequest extends VerifyAdminCodeRequest {
  personalCode: string;
}

export interface StartAdminCodeResponse {
  status: 'setup_code_sent' | 'personal_code_required';
  expiresAt?: string;
}

export interface VerifyAdminCodeResponse {
  accessToken: string;
  expiresAt: string;
  personalCodeExpiresAt?: string;
}

export interface AdminPricingIntelligence {
  metrics: {
    snapshotCount: number;
    bucketCount: number;
    flaggedBucketCount: number;
    averageBuffer: number;
    totals: {
      supplierEstimatedPrice: number;
      pcbClientPrice: number;
      shippingPrice: number;
      totalClientPrice: number;
    };
  };
  snapshots: AdminPricingSnapshot[];
  buckets: AdminBufferBucket[];
}

export interface AdminSupplierConnectionTest {
  supplier: string;
  configured: boolean;
  ok: boolean;
  expectedEnv: string[];
  message: string;
  diagnostics?: {
    endpoint: string;
    method: 'POST';
    headerNames: string[];
    apiKeyFingerprint: string;
    payloadSummary: Record<string, unknown>;
    payloadKeys: string[];
  };
  account?: {
    ok: boolean;
    statusCode: number;
    balance?: number;
    coupon?: number;
    point?: number;
    message: string;
  };
  quote?: {
    supplierQuoteId?: string;
    manufacturingPrice: number;
    shippingPrice: number;
    currency: 'EUR' | 'USD';
    leadTimeDays?: number;
  };
}

export interface TestSupplierConnectionRequest {
  supplier?: 'pcbway' | 'jlcpcb';
}

export interface AdminPricingSnapshot {
  id: string;
  quoteId: string;
  supplier: string;
  supplierEstimatedPrice: number;
  supplierRealPrice?: number;
  bufferUsed: number;
  serviceFee: number;
  pcbClientPrice: number;
  shippingPrice: number;
  totalClientPrice: number;
  bucketKey: string;
  riskScore: number;
  confidence: string;
  formulaVersion: string;
  reasons: unknown;
  inputSnapshot: Record<string, unknown>;
  createdAt: string;
  quote?: {
    id: string;
    productType: string;
    layers: number;
    quantity: number;
    destinationCountryIso2: string;
    createdAt: string;
  };
}

export interface AdminBufferBucket {
  id: string;
  bucketKey: string;
  layersRange: string;
  priceRange: string;
  finish: string;
  complexity: string;
  quantityRange: string;
  currentBuffer: number;
  averageErrorRate: number;
  sampleCount: number;
  confidence: string;
  riskFlag: boolean;
  lastErrorRate?: number;
  lastAdjustedAt?: string;
  updatedAt: string;
}

export interface UpdateAdminOrderStatusRequest {
  status: AdminOrderStatus;
  note?: string;
}

export interface AddSupplierReferenceRequest {
  externalManufacturingPartner: string;
  externalSupplierOrderId: string;
}

export interface RecordSupplierRealPriceRequest {
  realSupplierPrice: number;
  supplierOrderId?: string;
  note?: string;
}

export interface PrepareSupplierOrderRequest {
  mode?: 'prepare' | 'create';
  supplier?: string;
  note?: string;
}

export interface AdminSupplierOrderPackage {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  quoteId: string;
  supplier: string;
  mode: 'prepare' | 'create';
  liveCreateAvailable: boolean;
  status: string;
  supplierOrderId?: string;
  realSupplierPrice?: number;
  createdAt: string;
  customer: {
    email: string;
    fullName?: string | null;
    companyName?: string | null;
  };
  gerber: {
    uploadId: string;
    originalFilename: string;
    storageKey: string;
    fileSizeBytes: number;
    status: string;
    analysis: {
      widthMm?: number;
      heightMm?: number;
      detectedLayers?: number | null;
      holesCount: number;
      hasSlots: boolean;
      boardAreaCm2?: number;
      complexity: string;
      parserConfidence: number;
      units?: string | null;
      outlineSource?: string | null;
      copperLayerFiles: string[];
      drillFiles: string[];
      warnings: string[];
    } | null;
  } | null;
  pcb: {
    productType: string;
    gerberFileId: string;
    layers: number;
    lengthMm: number;
    widthMm: number;
    quantity: number;
    destinationCountryIso2: string;
    shippingMode: string;
    configSnapshot: Record<string, unknown>;
    supplierPayload: Record<string, unknown>;
  };
  pricing: {
    supplierEstimatedPrice: number | null;
    supplierRealPrice?: number | null;
    bufferUsed: number | null;
    serviceFee: number | null;
    pcbClientPrice: number | null;
    shippingPrice: number | null;
    totalClientPrice: number;
    currency: string;
    bucketKey: string | null;
    confidence: string;
    formulaVersion: string;
  };
  notes: string[];
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
  supplierRealPrice: {
    method: 'POST',
    path: '/api/admin/orders/:orderId/supplier-real-price',
    request: 'RecordSupplierRealPriceRequest',
    sensitivity: 'Admin-only supplier cost data. Never render on customer pages.',
  },
  supplierOrder: {
    method: 'POST',
    path: '/api/admin/orders/:orderId/supplier-order',
    request: 'PrepareSupplierOrderRequest',
    response: 'AdminSupplierOrderPackage',
    sensitivity: 'Admin-only supplier package. Never render on customer pages.',
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
  pricingIntelligence: {
    method: 'GET',
    path: '/api/admin/pricing-intelligence',
    response: 'AdminPricingIntelligence',
  },
  supplierConnectionTest: {
    method: 'POST',
    path: '/api/admin/supplier-connection-test',
    request: 'TestSupplierConnectionRequest',
    response: 'AdminSupplierConnectionTest',
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
  adminUsers: {
    method: 'GET',
    path: '/api/admin/access/admins',
    response: 'AdminAccessUser[]',
  },
  addAdminUser: {
    method: 'POST',
    path: '/api/admin/access/admins',
    request: 'AddAdminUserRequest',
  },
  removeAdminUser: {
    method: 'DELETE',
    path: '/api/admin/access/admins/:accessId',
  },
  resetAdminCode: {
    method: 'POST',
    path: '/api/admin/access/admins/:accessId/reset-code',
  },
  startAdminCode: {
    method: 'POST',
    path: '/api/admin/access/code/start',
    request: 'StartAdminCodeRequest',
    response: 'StartAdminCodeResponse',
  },
  setupAdminCode: {
    method: 'POST',
    path: '/api/admin/access/code/setup',
    request: 'SetupAdminCodeRequest',
    response: 'VerifyAdminCodeResponse',
  },
  verifyAdminCode: {
    method: 'POST',
    path: '/api/admin/access/code/verify',
    request: 'VerifyAdminCodeRequest',
    response: 'VerifyAdminCodeResponse',
  },
} as const;

export const adminOrderStatuses: AdminOrderStatus[] = [
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
  'cancelled',
  'refunded',
];

export const adminStatusLabels: Record<AdminOrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  supplier_order_pending: 'Commande fournisseur a passer',
  supplier_ordered: 'Commande fournisseur passee',
  supplier_in_production: 'Fabrication',
  china_3pl_received: '3PL Chine',
  shipped_to_africa: 'Expedition Afrique',
  customs_processing: 'Douane',
  out_for_delivery: 'Livraison locale',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};
