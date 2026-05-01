export const contactCategories = [
  'quote_issue',
  'upload_issue',
  'payment_issue',
  'delivery_issue',
  'technical_question',
  'partnership',
] as const;

export type ContactCategory = (typeof contactCategories)[number];

export interface ContactFormState {
  name: string;
  email: string;
  category: ContactCategory;
  orderId: string;
  message: string;
  attachmentName: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormState | 'form', string>>;

export interface CreatePublicSupportTicketRequest {
  name: string;
  email: string;
  category: ContactCategory;
  orderId?: string;
  message: string;
  attachmentName?: string;
}

export interface SupportTicketResponse {
  id: string;
  ticketNumber: string;
  status: 'open' | 'pending_customer' | 'pending_admin' | 'resolved' | 'closed';
  createdAt: string;
}

export const contactCategoryLabels: Record<ContactCategory, string> = {
  quote_issue: 'Probleme de devis',
  upload_issue: 'Probleme d upload',
  payment_issue: 'Probleme de paiement',
  delivery_issue: 'Probleme de livraison',
  technical_question: 'Question technique',
  partnership: 'Partenariat',
};

export const supportTicketApiContract = {
  publicContact: {
    method: 'POST',
    path: '/api/support/contact',
    request: 'CreatePublicSupportTicketRequest',
    response: 'SupportTicketResponse',
    note: 'Public support ticket intake. Optional file attachment is recorded as attachmentName until file upload storage is connected.',
  },
  authenticatedTickets: {
    method: 'POST',
    path: '/api/support/tickets',
    request: 'CreateSupportTicketDto',
    access: 'Authenticated user',
  },
} as const;

export function validateContactForm(values: ContactFormState): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = 'Entrez votre nom.';
  }

  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Entrez une adresse e-mail valide.';
  }

  if (!contactCategories.includes(values.category)) {
    errors.category = 'Choisissez une categorie support.';
  }

  if (values.orderId.trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(values.orderId.trim())) {
    errors.orderId = 'L ID commande doit etre un UUID valide.';
  }

  if (values.message.trim().length < 10) {
    errors.message = 'Expliquez votre demande en au moins 10 caracteres.';
  }

  return errors;
}
