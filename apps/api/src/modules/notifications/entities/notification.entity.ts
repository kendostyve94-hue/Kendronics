export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  readAt?: Date;
  createdAt: Date;
}
