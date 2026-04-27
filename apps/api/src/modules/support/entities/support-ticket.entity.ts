export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  requesterName?: string;
  requesterEmail?: string;
  category?: string;
  orderId?: string;
  subject: string;
  message?: string;
  attachmentName?: string;
  status: 'open' | 'pending_customer' | 'pending_admin' | 'resolved' | 'closed';
  createdAt: Date;
}
