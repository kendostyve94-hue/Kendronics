import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsRepository } from './repositories/payments.repository';

const HOUR_MS = 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const EXPIRING_WINDOW_MS = 24 * HOUR_MS;

@Injectable()
export class PaymentAuthorizationMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentAuthorizationMonitorService.name);
  private readonly warnedAuthorizationIds = new Set<string>();
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    void this.checkAuthorizations();
    this.interval = setInterval(() => void this.checkAuthorizations(), CHECK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async checkAuthorizations() {
    const now = new Date();
    const expiringCutoff = new Date(now.getTime() + EXPIRING_WINDOW_MS);
    const payments = await this.paymentsRepository.findAuthorizedCaptureBefore(expiringCutoff);

    for (const payment of payments) {
      if (!payment.captureBefore) continue;

      if (payment.captureBefore.getTime() <= now.getTime()) {
        this.warnedAuthorizationIds.delete(payment.id);
        await this.paymentsRepository.updateStatus(payment.id, 'expired');
        await this.notificationsService.create({
          userId: payment.userId,
          type: 'payment.authorization_expired',
          title: 'Autorisation expiree',
          body: 'Votre autorisation de paiement a expire avant le lancement. Aucun montant n a ete capture.',
        });
        this.logger.warn(`Stripe authorization expired for payment ${payment.id} / order ${payment.orderId}.`);
        continue;
      }

      if (this.warnedAuthorizationIds.has(payment.id)) {
        continue;
      }
      this.warnedAuthorizationIds.add(payment.id);
      await this.notificationsService.create({
        userId: payment.userId,
        type: 'payment.authorization_expiring',
        title: 'Autorisation proche expiration',
        body: 'Votre autorisation de paiement expire bientot. Le controle technique doit etre termine avant capture.',
      });
      this.logger.warn(`Stripe authorization is close to expiry for payment ${payment.id} / order ${payment.orderId}.`);
    }
  }
}
