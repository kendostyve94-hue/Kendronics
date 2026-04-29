import { Body, Controller, Headers, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateMobileMoneyPaymentDto } from './dto/create-mobile-money-payment.dto';
import { MobileMoneyCallbackDto } from './dto/mobile-money-callback.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCheckoutDto) {
    return this.paymentsService.createCheckout(user.id, user.email, dto);
  }

  @Post('mobile-money')
  @UseGuards(JwtAuthGuard)
  mobileMoney(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMobileMoneyPaymentDto) {
    return this.paymentsService.initiateMobileMoneyPayment(user.id, dto);
  }

  @Post('mobile-money/simulated-callback')
  mobileMoneySimulatedCallback(@Body() dto: MobileMoneyCallbackDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    return this.paymentsService.handleMobileMoneyCallback(dto);
  }

  @Post('webhooks/stripe')
  stripeWebhook(@Headers('stripe-signature') signature: string, @Req() request: { body: unknown; rawBody?: Buffer }) {
    return this.paymentsService.handleStripeWebhook(signature, request.rawBody, request.body);
  }
}
