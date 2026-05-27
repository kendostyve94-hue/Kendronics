import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { PreviewQuoteDto } from './dto/preview-quote.dto';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  @UseGuards(JwtAuthGuard)
  createQuote(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuoteDto) {
    return this.pricingService.createQuote(user.id, dto);
  }

  @Post('preview')
  previewQuote(@Body() dto: PreviewQuoteDto) {
    return this.pricingService.previewQuote(dto);
  }
}
