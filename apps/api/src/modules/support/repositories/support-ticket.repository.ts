import { Injectable } from '@nestjs/common';
import { SupportTicket as PrismaSupportTicket } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePublicSupportTicketDto, CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { SupportTicket } from '../entities/support-ticket.entity';

@Injectable()
export class SupportTicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<SupportTicket[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map(toSupportTicket);
  }

  async findAll(): Promise<SupportTicket[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map(toSupportTicket);
  }

  async create(userId: string, dto: CreateSupportTicketDto): Promise<SupportTicket> {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber: createTicketNumber(),
        userId,
        category: dto.category,
        orderId: dto.orderId,
        subject: dto.subject,
        message: dto.message,
        status: 'open',
      },
    });

    return toSupportTicket(ticket);
  }

  async createPublic(dto: CreatePublicSupportTicketDto): Promise<SupportTicket> {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber: createTicketNumber(),
        requesterName: dto.name,
        requesterEmail: dto.email.toLowerCase(),
        category: dto.category,
        orderId: dto.orderId,
        subject: publicSubjectFor(dto.category),
        message: dto.message,
        attachmentName: dto.attachmentName,
        status: 'open',
      },
    });

    return toSupportTicket(ticket);
  }
}

function toSupportTicket(ticket: PrismaSupportTicket): SupportTicket {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    userId: ticket.userId ?? 'public-contact',
    requesterName: ticket.requesterName ?? undefined,
    requesterEmail: ticket.requesterEmail ?? undefined,
    category: ticket.category ?? undefined,
    orderId: ticket.orderId ?? undefined,
    subject: ticket.subject,
    message: ticket.message ?? undefined,
    attachmentName: ticket.attachmentName ?? undefined,
    status: ticket.status as SupportTicket['status'],
    createdAt: ticket.createdAt,
  };
}

function createTicketNumber(): string {
  return `TKT-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function publicSubjectFor(category: string): string {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
