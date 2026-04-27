export interface AdminAuditLog {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  createdAt: Date;
}
