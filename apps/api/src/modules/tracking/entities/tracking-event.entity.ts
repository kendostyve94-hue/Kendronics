export interface TrackingEvent {
  id: string;
  orderId: string;
  status: string;
  title: string;
  description?: string;
  location?: string;
  occurredAt: Date;
}
