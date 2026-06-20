import { Body, Controller, Get, Headers, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateMobileMoneyPaymentDto } from './dto/create-mobile-money-payment.dto';
import { CreateProjectCheckoutDto } from './dto/create-project-checkout.dto';
import { AuthorizePaypalOrderDto } from './dto/authorize-paypal-order.dto';
import { CreatePaypalOrderDto } from './dto/create-paypal-order.dto';
import { MobileMoneyCallbackDto } from './dto/mobile-money-callback.dto';
import { ReuploadCorrectedFilesDto } from './dto/order-workflow.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCheckoutDto) {
    return this.paymentsService.createCheckout(user.id, user.email, dto);
  }

  @Post('project-checkout')
  @UseGuards(JwtAuthGuard)
  projectCheckout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectCheckoutDto) {
    return this.paymentsService.createProjectCheckout(user.id, user.email, dto);
  }

  @Post('mobile-money')
  @UseGuards(JwtAuthGuard)
  mobileMoney(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMobileMoneyPaymentDto) {
    return this.paymentsService.initiateMobileMoneyPayment(user.id, dto);
  }

  @Post('paypal/order')
  @UseGuards(JwtAuthGuard)
  paypalOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaypalOrderDto) {
    return this.paymentsService.createPaypalOrder(user.id, dto);
  }

  @Post('paypal/authorize')
  @UseGuards(JwtAuthGuard)
  paypalAuthorize(@CurrentUser() user: AuthenticatedUser, @Body() dto: AuthorizePaypalOrderDto) {
    return this.paymentsService.authorizePaypalOrder(user.id, dto);
  }

  @Post('orders/:orderId/cancel-after-rejection')
  @UseGuards(JwtAuthGuard)
  cancelAfterRejection(@CurrentUser() user: AuthenticatedUser, @Param('orderId') orderId: string) {
    return this.paymentsService.cancelAfterFirstRejection(user.id, orderId);
  }

  @Post('orders/:orderId/reupload-corrected-files')
  @UseGuards(JwtAuthGuard)
  reuploadCorrectedFiles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: ReuploadCorrectedFilesDto,
  ) {
    return this.paymentsService.reuploadCorrectedFiles(user.id, orderId, dto);
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

  @Get('webhooks/cinetpay')
  cinetPayWebhookAvailability() {
    return { received: true };
  }

  @Post('webhooks/cinetpay')
  cinetPayWebhook(@Body() body: Record<string, unknown>) {
    return this.paymentsService.handleCinetPayWebhook(body);
  }

  @Post('webhooks/paydunya')
  payDunyaWebhook(@Body() body: unknown, @Query() query: Record<string, unknown>) {
    return this.paymentsService.handlePayDunyaWebhook(body, query);
  }
}
