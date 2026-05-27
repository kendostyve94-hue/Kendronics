export const publicTrackingStatuses = [
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
    customerSafety: 'La recherche publique expose uniquement le statut, la timeline publique, le pays de destination, le transporteur et le numero de suivi.',
  },
} as const;

export const publicStatusLabels: Record<PublicOrderStatus, string> = {
  draft: 'Brouillon',
  quoted: 'Devis emis',
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
  cancelled: 'Annule',
  refunded: 'Rembourse',
};

export function isPublicTrackingStatus(status: string): status is PublicTrackingStatus {
  return publicTrackingStatuses.includes(status as PublicTrackingStatus);
}
