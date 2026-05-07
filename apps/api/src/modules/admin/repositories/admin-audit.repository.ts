import { Injectable } from '@nestjs/common';
import { AdminAuditLog as PrismaAdminAuditLog } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';

@Injectable()
export class AdminAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(actorUserId: string, action: string, targetType: string, targetId?: string): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        actorUserId,
        action,
        targetType,
        targetId,
      },
    });
  }

  async findRecent(limit = 100): Promise<AdminAuditLog[]> {
    const logs = await this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });

    return logs.map(toAdminAuditLog);
  }
}

function toAdminAuditLog(log: PrismaAdminAuditLog): AdminAuditLog {
  return {
    id: log.id,
    actorUserId: log.actorUserId,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId ?? undefined,
    createdAt: log.createdAt,
  };
}
