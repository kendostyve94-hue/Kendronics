import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { TrackingModule } from '../tracking/tracking.module';
import { MobileMoneyProvider } from './providers/mobile-money.provider';
import { SimulatedMobileMoneyProvider } from './providers/simulated-mobile-money.provider';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { PaymentWebhookHandler } from './webhooks/payment-webhook.handler';

@Module({
  imports: [OrdersModule, TrackingModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    StripePaymentProvider,
    PaymentWebhookHandler,
    {
      provide: MobileMoneyProvider,
      useClass: SimulatedMobileMoneyProvider,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
