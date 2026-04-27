import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { PricingService } from './pricing.service';

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  createQuote(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuoteDto) {
    return this.pricingService.createQuote(user.id, dto);
  }
}
