import { Injectable } from '@nestjs/common';
import { CreatePublicSupportTicketDto, CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { SupportTicket } from '../entities/support-ticket.entity';

@Injectable()
export class SupportTicketRepository {
  private readonly tickets = new Map<string, SupportTicket>();

  async findByUserId(userId: string): Promise<SupportTicket[]> {
    return [...this.tickets.values()].filter((ticket) => ticket.userId === userId);
  }

  async findAll(): Promise<SupportTicket[]> {
    return [...this.tickets.values()].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async create(userId: string, dto: CreateSupportTicketDto): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: crypto.randomUUID(),
      ticketNumber: `TKT-${Date.now()}`,
      userId,
      category: dto.category,
      orderId: dto.orderId,
      subject: dto.subject,
      message: dto.message,
      status: 'open',
      createdAt: new Date(),
    };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async createPublic(dto: CreatePublicSupportTicketDto): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: crypto.randomUUID(),
      ticketNumber: `TKT-${Date.now()}`,
      userId: 'public-contact',
      requesterName: dto.name,
      requesterEmail: dto.email.toLowerCase(),
      category: dto.category,
      orderId: dto.orderId,
      subject: publicSubjectFor(dto.category),
      message: dto.message,
      attachmentName: dto.attachmentName,
      status: 'open',
      createdAt: new Date(),
    };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }
}

function publicSubjectFor(category: string): string {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
