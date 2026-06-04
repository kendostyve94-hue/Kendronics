import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MondayConfigService } from './monday-config.service';

type MondayWebhookResult = {
  ok: true;
  duplicate?: boolean;
  eventId?: string;
  board?: string;
  applied?: boolean;
};

@Injectable()
export class MondayWebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: MondayConfigService,
  ) {}

  async handleWebhook(input: {
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, unknown>;
  }): Promise<MondayWebhookResult | { challenge: string }> {
    const body = objectValue(input.body);
    if (typeof body.challenge === 'string') {
      return { challenge: body.challenge };
    }

    this.verifySecret(input.headers, input.query);

    const event = objectValue(body.event ?? body);
    if (!Object.keys(event).length) throw new BadRequestException('Invalid Monday webhook payload.');

    const boardId = firstString(event, ['boardId', 'board_id']);
    const itemId = firstString(event, ['pulseId', 'itemId', 'item_id']);
    const eventType = firstString(event, ['type', 'event', 'triggerEvent']) ?? 'monday.webhook';
    const providerEventId = firstString(event, ['triggerUuid', 'webhookId', 'id']) ?? eventHash(event);
    const board = this.boardKeyFromId(boardId);

    const existing = await this.prisma.mondayWebhookEvent.findUnique({ where: { providerEventId } });
    if (existing) return { ok: true, duplicate: true, eventId: existing.id, board: existing.board ?? undefined };

    const webhookEvent = await this.prisma.mondayWebhookEvent.create({
      data: {
        providerEventId,
        board,
        boardId,
        itemId,
        eventType,
        payload: event as Prisma.InputJsonValue,
      },
    });

    try {
      const applied = await this.applyAllowedChange(board, itemId, event);
      await this.prisma.mondayWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processedAt: new Date(), processingError: null },
      });
      await this.prisma.userAuditLog.create({
        data: {
          eventType: applied ? 'monday.webhook.applied' : 'monday.webhook.received',
          metadataJson: {
            board,
            boardId,
            itemId,
            eventType,
            providerEventId,
            applied,
          } as Prisma.InputJsonValue,
        },
      });
      return { ok: true, eventId: webhookEvent.id, board, applied };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Monday webhook processing failed.';
      await this.prisma.mondayWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processedAt: new Date(), processingError: message.slice(0, 900) },
      });
      throw error;
    }
  }

  private verifySecret(headers: Record<string, string | string[] | undefined>, query: Record<string, unknown>): void {
    const expected = process.env.MONDAY_WEBHOOK_SECRET?.trim();
    if (!expected) return;

    const provided =
      headerValue(headers, 'x-kendronics-monday-secret') ??
      bearerToken(headerValue(headers, 'authorization')) ??
      (typeof query.secret === 'string' ? query.secret : undefined);

    if (provided !== expected) {
      throw new ForbiddenException('Invalid Monday webhook secret.');
    }
  }

  private boardKeyFromId(boardId: string | undefined): string | undefined {
    if (!boardId) return undefined;
    const boards = [
      'COMMANDES',
      'CHIFFRE_AFFAIRE_LIVE',
      'EN_PRODUCTION',
      'LOGISTICS_INTERNATIONAL',
      'LOGISTIQUE_LOCALE',
      'SUPPORT_CLIENTS',
      'REGISTRE_ACHATS_DEPENSES',
      'TRESORERIE',
    ];
    return boards.find((board) => this.config.boardIdFor(board) === boardId);
  }

  private async applyAllowedChange(board: string | undefined, itemId: string | undefined, event: Record<string, unknown>): Promise<boolean> {
    if (!board || !itemId) return false;
    const syncLog = await this.prisma.mondaySyncLog.findFirst({
      where: { board, itemId, orderId: { not: null } },
      orderBy: { processedAt: 'desc' },
      select: { orderId: true },
    });
    if (!syncLog?.orderId) return false;

    const columnTitle = normalizeTitle(firstString(event, ['columnTitle', 'column_title', 'columnName']) ?? '');
    const nextLabel = statusLabel(event);
    const textValue = firstString(event, ['value', 'textValue']);

    if (board === 'COMMANDES' && columnTitle.includes('statut verification fournisseur') && nextLabel) {
      await this.prisma.order.update({
        where: { id: syncLog.orderId },
        data: { supplierReviewStatus: normalizeStatus(nextLabel) },
      });
      return true;
    }

    if (board === 'COMMANDES' && columnTitle.includes('retour technique fournisseur') && textValue) {
      await this.prisma.order.update({
        where: { id: syncLog.orderId },
        data: { supplierFeedback: textValue.slice(0, 2000) },
      });
      return true;
    }

    if (board === 'COMMANDES' && columnTitle.includes('id commande fournisseur') && textValue) {
      await this.prisma.order.update({
        where: { id: syncLog.orderId },
        data: { externalSupplierOrderId: textValue.slice(0, 200) },
      });
      return true;
    }

    if (board === 'COMMANDES' && columnTitle === 'fournisseur' && textValue) {
      await this.prisma.order.update({
        where: { id: syncLog.orderId },
        data: { externalManufacturingPartner: textValue.slice(0, 120) },
      });
      return true;
    }

    if (board === 'EN_PRODUCTION' && columnTitle.includes('statut production') && nextLabel) {
      await this.prisma.productionJob.updateMany({
        where: { orderId: syncLog.orderId },
        data: { status: normalizeStatus(nextLabel) },
      });
      return true;
    }

    if (board === 'LOGISTIQUE_LOCALE' && columnTitle.includes('statut livraison locale') && nextLabel) {
      await this.prisma.localShipment.updateMany({
        where: { orderId: syncLog.orderId },
        data: { status: normalizeStatus(nextLabel) },
      });
      if (normalizeTitle(nextLabel) === 'livre') {
        await this.prisma.order.update({ where: { id: syncLog.orderId }, data: { status: 'delivered', deliveredAt: new Date() } });
      }
      return true;
    }

    return false;
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function firstString(value: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const entry = value[key];
    if (typeof entry === 'string' && entry.trim()) return entry.trim();
    if (typeof entry === 'number') return String(entry);
  }
  return undefined;
}

function headerValue(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const entry = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(entry)) return entry[0];
  return entry;
}

function bearerToken(value: string | undefined): string | undefined {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function eventHash(event: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(event)).digest('hex');
}

function statusLabel(event: Record<string, unknown>): string | undefined {
  const value = objectValue(event.value);
  return firstString(value, ['label', 'text']) ?? firstString(event, ['label', 'textValue']);
}

function normalizeTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeStatus(value: string): string {
  return normalizeTitle(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
