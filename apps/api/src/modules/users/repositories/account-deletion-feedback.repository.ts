import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountDeletionFeedbackDto } from '../dto/account-deletion-feedback.dto';

@Injectable()
export class AccountDeletionFeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: { id: string; email: string }, dto: AccountDeletionFeedbackDto): Promise<{ ok: true }> {
    await this.prisma.accountDeletionFeedback.create({
      data: {
        userId: user.id,
        emailHash: hashEmail(user.email),
        reason: dto.reason,
        details: (dto.details ?? {}) as Prisma.InputJsonObject,
        orderedBefore: cleanOptional(dto.orderedBefore),
        improvementPriority: cleanOptional(dto.improvementPriority),
        keepReason: cleanOptional(dto.keepReason),
        alternative: cleanOptional(dto.alternative),
      },
    });

    return { ok: true };
  }
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function cleanOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
