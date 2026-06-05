import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePublicSupportTicketDto, CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { EmailNotificationService } from './email-notification.service';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportTicketRepository } from './repositories/support-ticket.repository';

@Injectable()
export class SupportService {
  constructor(
    private readonly ticketRepository: SupportTicketRepository,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  listTickets(userId: string): Promise<SupportTicket[]> {
    return this.ticketRepository.findByUserId(userId);
  }

  listAllTickets(): Promise<SupportTicket[]> {
    return this.ticketRepository.findAll();
  }

  async createTicket(userId: string, dto: CreateSupportTicketDto): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.create(userId, dto);
    await this.notificationsService.create({
      userId,
      type: 'support.ticket.created',
      title: 'Ticket support cree',
      body: `Votre demande ${ticket.ticketNumber} a bien ete recue par Kendronics.`,
    });
    await this.emailNotificationService.sendSupportTicketNotification(ticket);
    await this.queueMondaySupportTicket(ticket);
    return ticket;
  }

  async createPublicTicket(dto: CreatePublicSupportTicketDto): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.createPublic(dto);
    await this.emailNotificationService.sendSupportTicketNotification(ticket);
    await this.queueMondaySupportTicket(ticket);
    return ticket;
  }

  private async queueMondaySupportTicket(ticket: SupportTicket): Promise<void> {
    await this.prisma.mondaySyncLog.create({
      data: {
        orderId: ticket.orderId,
        board: 'SUPPORT_CLIENTS',
        operation: 'support_ticket_created',
        sourceEventId: `support-${ticket.id}`,
        status: 'pending',
        payload: {
          ticketNumber: ticket.ticketNumber,
          customerName: ticket.requesterName,
          customerEmail: ticket.requesterEmail,
          creationDate: ticket.createdAt.toISOString(),
          category: mondaySupportCategory(ticket.category),
          ticketStatus: mondaySupportStatus(ticket.status),
          ticketPriority: 'Normal',
          firstResponseDeadline: deadlineIso(4),
          resolutionNotes: mondaySupportCustomerMessage(ticket),
          subject: ticket.subject,
          orderLink: ticket.orderId ? `${frontendOrigin()}/orders/${ticket.orderId}` : undefined,
        } as Prisma.InputJsonValue,
      },
    });
  }
}

function mondaySupportCustomerMessage(ticket: SupportTicket): string {
  const lines = [
    ticket.subject ? `Sujet: ${ticket.subject}` : undefined,
    ticket.message ? `Message client:\n${ticket.message}` : undefined,
    ticket.attachmentName ? `Piece jointe client: ${ticket.attachmentName}` : undefined,
  ].filter((line): line is string => Boolean(line));

  return lines.join('\n\n');
}

function deadlineIso(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function mondaySupportCategory(category: string | null | undefined): string {
  const categories: Record<string, string> = {
    quote_issue: 'Défaut PCB',
    upload_issue: 'Défaut PCB',
    payment_issue: 'Problème Paiement',
    delivery_issue: 'Retard Expédition',
    technical_question: 'Problème Technique',
    partnership: 'Autre',
  };
  return categories[category ?? ''] ?? 'Autre';
}

function mondaySupportStatus(status: string | null | undefined): string {
  const statuses: Record<string, string> = {
    open: 'Ouvert',
    pending_customer: 'En attente client',
    pending_admin: 'En cours',
    resolved: 'Résolu',
    closed: 'Fermé',
  };
  return statuses[status ?? ''] ?? 'Ouvert';
}

function frontendOrigin(): string {
  return process.env.FRONTEND_ORIGIN ?? process.env.FRONTEND_URL ?? 'https://kendronics.com';
}
