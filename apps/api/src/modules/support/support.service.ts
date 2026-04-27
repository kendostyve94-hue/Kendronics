import { Injectable } from '@nestjs/common';
import { CreatePublicSupportTicketDto, CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { EmailNotificationService } from './email-notification.service';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportTicketRepository } from './repositories/support-ticket.repository';

@Injectable()
export class SupportService {
  constructor(
    private readonly ticketRepository: SupportTicketRepository,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  listTickets(userId: string): Promise<SupportTicket[]> {
    return this.ticketRepository.findByUserId(userId);
  }

  listAllTickets(): Promise<SupportTicket[]> {
    return this.ticketRepository.findAll();
  }

  async createTicket(userId: string, dto: CreateSupportTicketDto): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.create(userId, dto);
    await this.emailNotificationService.sendSupportTicketNotification(ticket);
    return ticket;
  }

  async createPublicTicket(dto: CreatePublicSupportTicketDto): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.createPublic(dto);
    await this.emailNotificationService.sendSupportTicketNotification(ticket);
    return ticket;
  }
}
