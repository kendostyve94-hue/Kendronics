export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  body?: string;
};
