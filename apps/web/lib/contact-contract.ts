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
  upload_issue: 'Upload issue',
  payment_issue: 'Payment issue',
  delivery_issue: 'Delivery issue',
  technical_question: 'Technical question',
  partnership: 'Partnership',
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
    errors.name = 'Enter your name.';
  }

  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!contactCategories.includes(values.category)) {
    errors.category = 'Choose a support category.';
  }

  if (values.orderId.trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(values.orderId.trim())) {
    errors.orderId = 'L ID commande doit etre un UUID valide.';
  }

  if (values.message.trim().length < 10) {
    errors.message = 'Tell us what happened in at least 10 characters.';
  }

  return errors;
}
