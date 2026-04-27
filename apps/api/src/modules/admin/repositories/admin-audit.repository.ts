import { Injectable } from '@nestjs/common';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';

@Injectable()
export class AdminAuditRepository {
  private readonly logs: AdminAuditLog[] = [];

  async record(actorUserId: string, action: string, targetType: string, targetId?: string): Promise<void> {
    this.logs.push({
      id: crypto.randomUUID(),
      actorUserId,
      action,
      targetType,
      targetId,
      createdAt: new Date(),
    });
  }

  async findRecent(limit = 100): Promise<AdminAuditLog[]> {
    return [...this.logs]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  }
}
