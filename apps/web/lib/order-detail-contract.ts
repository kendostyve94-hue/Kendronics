export const customerTrackingStatuses = [
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
] as const;

export type CustomerTrackingStatus = (typeof customerTrackingStatuses)[number];

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'canceled' | 'expired' | 'refunded';

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
    response: 'Resume de commande protege client avec les donnees de devis disponibles.',
    customerSafety: 'Ne pas exposer externalManufacturingPartner ni externalSupplierOrderId.',
  },
  deleteOrder: {
    method: 'DELETE',
    path: '/api/orders/:orderId',
    response: '204 sans contenu lorsque le client authentifie possede la commande.',
  },
  tracking: {
    method: 'GET',
    path: '/api/tracking/:orderId',
    response: 'Evenements de suivi client bases sur les jalons publics.',
  },
  support: {
    method: 'GET',
    path: '/contact?orderId=:orderId',
    response: 'Formulaire support pre-rempli avec la reference de commande client.',
  },
} as const;

export const statusLabels: Record<CustomerTrackingStatus, string> = {
  awaiting_payment: 'Paiement en attente',
  payment_authorized: 'Paiement autorise',
  supplier_review_pending: 'Verification des fichiers',
  supplier_files_rejected: 'Fichiers refuses',
  paid: 'Paiement capture',
  supplier_order_pending: 'Commande partenaire en attente',
  supplier_ordered: 'Commande partenaire envoyee',
  supplier_in_production: 'En production',
  china_3pl_received: 'Recu par la logistique',
  shipped_to_africa: 'Expedie vers la destination',
  customs_processing: 'Traitement douanier',
  out_for_delivery: 'En cours de livraison',
  delivered: 'Livre',
};

export function isCustomerTrackingStatus(status: string): status is CustomerTrackingStatus {
  return customerTrackingStatuses.includes(status as CustomerTrackingStatus);
}
