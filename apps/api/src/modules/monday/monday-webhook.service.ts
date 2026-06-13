import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailNotificationService } from '../support/email-notification.service';
import { MondayApiService, MondayItemDetails } from './monday-api.service';
import { MondayConfigService } from './monday-config.service';
import { MondayColumnTarget } from './monday-config.service';
import { MondayMapperService } from './monday-mapper.service';

type MondayWebhookResult = {
  ok: true;
  duplicate?: boolean;
  eventId?: string;
  board?: string;
  applied?: boolean;
};

@Injectable()
export class MondayWebhookService {
  private readonly logger = new Logger(MondayWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: MondayConfigService,
    private readonly api: MondayApiService,
    private readonly mapper: MondayMapperService,
    private readonly emailNotificationService: EmailNotificationService,
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
    if (board === 'SUPPORT_CLIENTS') {
      return this.applySupportReplyChange(itemId, event);
    }

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

  private async applySupportReplyChange(itemId: string, event: Record<string, unknown>): Promise<boolean> {
    const apiKey = this.config.apiKey();
    const boardId = this.config.boardIdFor('SUPPORT_CLIENTS');
    if (!apiKey || !boardId) return false;

    const triggerTarget = await this.findSupportTarget('sendClientReply', apiKey, boardId, [
      'Envoyer réponse client',
      'Envoyer reponse client',
      'Réponse client',
      'Reponse client',
    ]);
    const replyTarget = await this.findSupportTarget('clientReply', apiKey, boardId, [
      'Réponse à envoyer au client',
      'Reponse a envoyer au client',
      'Réponse client à envoyer',
      'Reponse client a envoyer',
    ]);
    const eventColumnId = firstString(event, ['columnId', 'column_id']);
    if (eventColumnId && ![triggerTarget?.id, replyTarget?.id].includes(eventColumnId)) return false;
    if (!triggerTarget?.id || !replyTarget?.id) return false;

    const item = await this.api.getItemColumnValues(apiKey, itemId);
    if (!item) return false;

    const triggerLabel = columnText(item, triggerTarget) ?? statusLabel(event);
    if (!isSendReplyLabel(triggerLabel)) return false;

    const message = columnText(item, replyTarget)?.trim();
    if (!message) {
      await this.markSupportReplyFailed(apiKey, boardId, itemId, triggerTarget, 'Erreur');
      this.logger.warn(`Monday support reply skipped for item ${itemId}: missing client reply text.`);
      return true;
    }

    const emailTarget = await this.findSupportTarget('customerEmail', apiKey, boardId, ['Email Client', 'E-mail Client']);
    const nameTarget = await this.findSupportTarget('customerName', apiKey, boardId, ['Nom Client']);
    const ticketTarget = await this.findSupportTarget('ticketNumber', apiKey, boardId, ['ID Ticket Support', 'Élément', 'Element']);
    const requesterEmail = emailTarget ? extractEmail(columnText(item, emailTarget)) : undefined;
    const requesterName = nameTarget ? columnText(item, nameTarget) : undefined;
    const ticketNumber = ticketTarget?.id === 'name' ? item.name : columnText(item, ticketTarget) ?? item.name;

    if (!requesterEmail) {
      await this.markSupportReplyFailed(apiKey, boardId, itemId, triggerTarget, 'Erreur');
      this.logger.warn(`Monday support reply skipped for item ${itemId}: missing customer email.`);
      return true;
    }

    const sourceEventId = `support-reply-${itemId}-${eventHash({ requesterEmail, message })}`;
    const alreadySent = await this.prisma.mondaySyncLog.findUnique({
      where: {
        board_operation_sourceEventId: {
          board: 'SUPPORT_CLIENTS',
          operation: 'support_reply_sent',
          sourceEventId,
        },
      },
      select: { id: true },
    });
    if (alreadySent) return true;

    await this.emailNotificationService.sendSupportReply({
      to: requesterEmail,
      requesterName,
      ticketNumber,
      message,
    });

    await this.prisma.mondaySyncLog.create({
      data: {
        board: 'SUPPORT_CLIENTS',
        operation: 'support_reply_sent',
        sourceEventId,
        status: 'processed',
        itemId,
        processedAt: new Date(),
        payload: {
          itemId,
          ticketNumber,
          requesterEmail,
          replyHash: eventHash({ message }),
        } as Prisma.InputJsonValue,
      },
    });

    await this.markSupportReplySent(apiKey, boardId, itemId, triggerTarget);
    return true;
  }

  private async findSupportTarget(field: string, apiKey: string, boardId: string, titleCandidates: string[]): Promise<MondayColumnTarget | undefined> {
    const mapped = await this.mapper.targetForField('SUPPORT_CLIENTS', field, apiKey, boardId);
    if (mapped?.id) return mapped;
    for (const title of titleCandidates) {
      const target = await this.mapper.targetForTitle('SUPPORT_CLIENTS', title, apiKey, boardId);
      if (target?.id) return target;
    }
    return undefined;
  }

  private async markSupportReplySent(apiKey: string, boardId: string, itemId: string, triggerTarget: MondayColumnTarget): Promise<void> {
    const values: Record<string, unknown> = {};
    values[triggerTarget.id] = { label: 'Envoyé' };

    const sentAtTarget = await this.findSupportTarget('clientReplySentAt', apiKey, boardId, [
      'Date Envoi Réponse Client',
      'Date Envoi Reponse Client',
    ]);
    if (sentAtTarget?.id && sentAtTarget.type === 'date') {
      values[sentAtTarget.id] = { date: new Date().toISOString().slice(0, 10) };
    }

    const replyStatusTarget = await this.findSupportTarget('clientReplyStatus', apiKey, boardId, [
      'Statut Réponse Client',
      'Statut Reponse Client',
    ]);
    if (replyStatusTarget?.id && replyStatusTarget.id !== triggerTarget.id) {
      values[replyStatusTarget.id] = { label: 'Envoyé' };
    }

    await this.api.updateItem(apiKey, boardId, itemId, JSON.stringify(values));
  }

  private async markSupportReplyFailed(
    apiKey: string,
    boardId: string,
    itemId: string,
    triggerTarget: MondayColumnTarget,
    label: string,
  ): Promise<void> {
    await this.api.updateItem(apiKey, boardId, itemId, JSON.stringify({ [triggerTarget.id]: { label } }));
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

function columnText(item: MondayItemDetails, target: MondayColumnTarget | undefined): string | undefined {
  if (!target?.id) return undefined;
  if (target.id === 'name') return item.name;
  const value = item.columnValues.find((column) => column.id === target.id);
  return value?.text?.trim() || textFromMondayValue(value?.value);
}

function textFromMondayValue(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object') {
      const object = parsed as Record<string, unknown>;
      const text = firstString(object, ['text', 'email', 'label']);
      if (text) return text;
      const label = objectValue(object.label);
      return firstString(label, ['text']);
    }
  } catch {
    return value;
  }
  return undefined;
}

function extractEmail(value: string | undefined): string | undefined {
  return value?.match(/[^\s<>,;]+@[^\s<>,;]+\.[^\s<>,;]+/)?.[0];
}

function isSendReplyLabel(value: string | undefined): boolean {
  const label = normalizeTitle(value ?? '');
  return [
    'envoyer',
    'a envoyer',
    'envoyer reponse client',
    'send',
    'send reply',
  ].includes(label);
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
