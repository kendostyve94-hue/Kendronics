import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MondayApiService } from './monday-api.service';
import { MondayConfigService } from './monday-config.service';
import { MondayMapperService } from './monday-mapper.service';

const intervalMs = 60_000;
const batchSize = 10;

@Injectable()
export class MondaySyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MondaySyncService.name);
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly api: MondayApiService,
    private readonly config: MondayConfigService,
    private readonly mapper: MondayMapperService,
  ) {}

  onModuleInit() {
    if (process.env.MONDAY_SYNC_DISABLED === 'true') return;
    void this.processPending();
    this.interval = setInterval(() => void this.processPending(), intervalMs);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async processPending() {
    const logs = await this.prisma.mondaySyncLog.findMany({
      where: { status: { in: ['pending', 'retry'] } },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    for (const log of logs) {
      try {
        const itemId = await this.upsertMondayItem(log.id, log.board, log.operation, log.orderId, log.payload);
        await this.prisma.mondaySyncLog.update({
          where: { id: log.id },
          data: {
            status: 'processed',
            itemId,
            processedAt: new Date(),
            error: null,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Monday sync failed.';
        this.logger.warn(`Monday sync failed for ${log.board}/${log.operation}/${log.sourceEventId}: ${message}`);
        await this.prisma.mondaySyncLog.update({
          where: { id: log.id },
          data: {
            status: 'retry',
            error: message.slice(0, 900),
          },
        });
      }
    }
  }

  private async upsertMondayItem(logId: string, board: string, operation: string, orderId: string | null, payload: unknown): Promise<string | undefined> {
    const apiKey = this.config.apiKey();
    const boardId = this.config.boardIdFor(board);
    if (!apiKey || !boardId) {
      if (this.config.required()) {
        throw new Error(`Monday is required but not configured for board ${board}.`);
      }
      return undefined;
    }

    const itemName = itemNameFor(operation, payload);
    const columnValues = JSON.stringify(await this.mapper.columnValuesFor(board, payload, apiKey, boardId));
    const existingItemId = await this.findExistingItemId(logId, board, orderId, payload, apiKey, boardId);
    if (existingItemId) {
      return this.api.updateItem(apiKey, boardId, existingItemId, columnValues);
    }

    return this.api.createItem(apiKey, boardId, itemName, columnValues);
  }

  private async findExistingItemId(
    logId: string,
    board: string,
    orderId: string | null,
    payload: unknown,
    apiKey: string,
    boardId: string,
  ): Promise<string | undefined> {
    const existingLog = orderId
      ? await this.prisma.mondaySyncLog.findFirst({
          where: {
            id: { not: logId },
            board,
            orderId,
            itemId: { not: null },
            status: 'processed',
          },
          orderBy: { processedAt: 'desc' },
          select: { itemId: true },
        })
      : null;
    if (existingLog?.itemId) return existingLog.itemId;

    const value = objectValue(payload);
    const identityField = this.config.identityFieldFor(board);
    const identityValue = value[identityField];
    if (identityValue == null || !['string', 'number'].includes(typeof identityValue)) return undefined;

    const target = await this.mapper.targetForField(board, identityField, apiKey, boardId);
    if (!target?.id) return undefined;
    if (target.id === 'name') return undefined;

    return this.api.findItemByColumn(apiKey, boardId, target.id, String(identityValue));
  }
}

function itemNameFor(operation: string, payload: unknown): string {
  const value = objectValue(payload);
  return String(value.orderNumber ?? value.ticketNumber ?? value.expenseId ?? value.treasuryMonth ?? value.internalReference ?? value.paymentId ?? operation).slice(0, 255);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
