export interface AdminAuditLog {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
