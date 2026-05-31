import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const intervalMs = 60_000;
const batchSize = 10;

@Injectable()
export class MondaySyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MondaySyncService.name);
  private interval?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

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
        const itemId = await this.upsertMondayItem(log.board, log.operation, log.payload);
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

  private async upsertMondayItem(board: string, operation: string, payload: unknown): Promise<string | undefined> {
    const apiKey = process.env.MONDAY_API_KEY?.trim();
    const boardId = boardIdFor(board);
    if (!apiKey || !boardId) {
      if (process.env.NODE_ENV === 'production' && process.env.MONDAY_REQUIRED === 'true') {
        throw new Error(`Monday is required but not configured for board ${board}.`);
      }
      return undefined;
    }

    const itemName = itemNameFor(operation, payload);
    const columnValues = JSON.stringify(columnValuesFor(payload));
    const query = `
      mutation CreateKendronicsItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
          id
        }
      }
    `;
    const response = await fetch(process.env.MONDAY_API_URL ?? 'https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { boardId, itemName, columnValues } }),
    });
    const data = await response.json().catch(() => null) as { data?: { create_item?: { id?: string } }; errors?: Array<{ message?: string }> } | null;
    if (!response.ok || data?.errors?.length) {
      throw new Error(data?.errors?.map((item) => item.message).filter(Boolean).join(' ') || `Monday API rejected request (${response.status}).`);
    }

    return data?.data?.create_item?.id;
  }
}

function boardIdFor(board: string): string | undefined {
  const key = `MONDAY_BOARD_${board.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_ID`;
  return process.env[key]?.trim();
}

function itemNameFor(operation: string, payload: unknown): string {
  const value = objectValue(payload);
  return String(value.orderNumber ?? value.internalReference ?? value.paymentId ?? operation).slice(0, 255);
}

function columnValuesFor(payload: unknown): Record<string, string | number | boolean | null> {
  const value = objectValue(payload);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry == null || ['string', 'number', 'boolean'].includes(typeof entry))
      .map(([key, entry]) => [key, entry as string | number | boolean | null]),
  );
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
