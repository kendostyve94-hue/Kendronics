import { Body, Controller, Get, Logger, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreatePublicSupportTicketDto, CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

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
  @UseInterceptors(FileInterceptor('attachment', { limits: { fileSize: 4 * 1024 * 1024 } }))
  createPublicTicket(
    @Body() dto: CreatePublicSupportTicketDto,
    @UploadedFile()
    attachment?: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    if (attachment?.buffer?.length) {
      this.logger.log(`Public support ticket received attachment: ${attachment.originalname} (${attachment.size} bytes).`);
    } else if (dto.attachmentName) {
      this.logger.warn(`Public support ticket received attachment name "${dto.attachmentName}" but no file binary.`);
    } else {
      this.logger.log('Public support ticket received without attachment.');
    }
    return this.supportService.createPublicTicket(dto, attachment);
  }
}
