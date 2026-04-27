import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreatePublicSupportTicketDto, CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  listTickets(@CurrentUser() user: AuthenticatedUser) {
    return this.supportService.listTickets(user.id);
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  createTicket(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupportTicketDto) {
    return this.supportService.createTicket(user.id, dto);
  }

  @Post('contact')
  createPublicTicket(@Body() dto: CreatePublicSupportTicketDto) {
    return this.supportService.createPublicTicket(dto);
  }
}
