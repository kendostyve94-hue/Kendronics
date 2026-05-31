import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const intervalMs = 60_000;
const batchSize = 10;
const mondayBoardAliases: Record<string, string> = {
  COMMANDES: 'COMMANDES',
  EN_PRODUCTION: 'EN_PRODUCTION',
  CHIFFRE_AFFAIRE_LIVE: 'CHIFFRE_AFFAIRE_LIVE',
  LOGISTICS_INTERNATIONAL: 'LOGISTICS_INTERNATIONAL',
  LOGISTIQUE_LOCALE: 'LOGISTIQUE_LOCALE',
  SUPPORT_CLIENTS: 'SUPPORT_CLIENTS',
};

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
    const columnValues = JSON.stringify(await this.columnValuesFor(board, payload, apiKey, boardId));
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

  private async columnValuesFor(board: string, payload: unknown, apiKey: string, boardId: string): Promise<Record<string, unknown>> {
    const value = objectValue(payload);
    const idMap = columnMapFor(board, 'MAP');
    const titleMap = columnMapFor(board, 'TITLE_MAP');
    const resolvedTitleMap = Object.keys(titleMap).length > 0 ? await this.resolveColumnTitles(apiKey, boardId, titleMap) : {};
    const columnMap: Record<string, MondayColumnTarget> = {
      ...Object.fromEntries(Object.entries(idMap).map(([source, id]) => [source, { id }])),
      ...resolvedTitleMap,
    };

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => columnMap[key] && (entry == null || ['string', 'number', 'boolean'].includes(typeof entry)))
        .map(([key, entry]) => [columnMap[key].id, mondayColumnValue(entry as string | number | boolean | null, columnMap[key].type)]),
    );
  }

  private async resolveColumnTitles(apiKey: string, boardId: string, sourceToTitle: Record<string, string>): Promise<Record<string, MondayColumnTarget>> {
    const query = `
      query KendronicsBoardColumns($boardId: ID!) {
        boards(ids: [$boardId]) {
          columns {
            id
            title
            type
          }
        }
      }
    `;
    const response = await fetch(process.env.MONDAY_API_URL ?? 'https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { boardId } }),
    });
    const data = await response.json().catch(() => null) as { data?: { boards?: Array<{ columns?: Array<{ id?: string; title?: string; type?: string }> }> }; errors?: Array<{ message?: string }> } | null;
    if (!response.ok || data?.errors?.length) {
      throw new Error(data?.errors?.map((item) => item.message).filter(Boolean).join(' ') || `Monday column discovery failed (${response.status}).`);
    }

    const titleToId = new Map(
      (data?.data?.boards?.[0]?.columns ?? [])
        .filter((column) => column.id && column.title)
        .map((column) => [normalizeTitle(column.title), { id: column.id as string, type: column.type }]),
    );

    const resolved: Record<string, MondayColumnTarget> = {};
    for (const [source, title] of Object.entries(sourceToTitle)) {
      const target = titleToId.get(normalizeTitle(title));
      if (target) resolved[source] = target;
    }
    return resolved;
  }
}

function boardIdFor(board: string): string | undefined {
  const canonical = canonicalBoard(board);
  const key = `MONDAY_BOARD_${canonical}_ID`;
  return process.env[key]?.trim();
}

function itemNameFor(operation: string, payload: unknown): string {
  const value = objectValue(payload);
  return String(value.orderNumber ?? value.internalReference ?? value.paymentId ?? operation).slice(0, 255);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function columnMapFor(board: string, suffix: 'MAP' | 'TITLE_MAP'): Record<string, string> {
  const key = `MONDAY_COLUMN_${suffix}_${canonicalBoard(board)}`;
  const raw = process.env[key]?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => typeof value === 'string' && value.trim())
        .map(([source, target]) => [source, String(target).trim()]),
    );
  } catch {
    return {};
  }
}

function canonicalBoard(board: string): string {
  const normalized = board.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  return mondayBoardAliases[normalized] ?? normalized;
}

function normalizeTitle(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

type MondayColumnTarget = { id: string; type?: string };

function mondayColumnValue(value: string | number | boolean | null, type?: string): unknown {
  if (value == null) return null;
  if (type === 'status') return { label: String(value) };
  if (type === 'date') return { date: String(value).slice(0, 10) };
  if (type === 'numbers') return typeof value === 'number' ? value : Number(value) || 0;
  if (type === 'link') return { url: String(value), text: String(value).slice(0, 120) };
  return value;
}
