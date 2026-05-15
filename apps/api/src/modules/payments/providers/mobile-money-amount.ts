import { ServiceUnavailableException } from '@nestjs/common';

export function getMobileMoneyCurrency(): string {
  return (process.env.MOBILE_MONEY_CURRENCY ?? 'XOF').toUpperCase();
}

export function convertEuroToMobileMoneyAmount(amountEur: number): number {
  const currency = getMobileMoneyCurrency();
  if (currency === 'EUR') {
    return Math.ceil(amountEur);
  }

  const rate = Number(process.env.MOBILE_MONEY_EUR_TO_LOCAL_RATE);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new ServiceUnavailableException(
      'MOBILE_MONEY_EUR_TO_LOCAL_RATE is required for local-currency Mobile Money payments.',
    );
  }

  const amount = Math.ceil(amountEur * rate);
  return Math.max(5, Math.ceil(amount / 5) * 5);
}

export function getMobileMoneyReturnUrl(orderId: string): string {
  const origin = process.env.FRONTEND_ORIGIN?.split(',')[0] ?? 'http://localhost:3000';
  return `${origin}/orders/${orderId}?payment=mobile-money`;
}

export function getMobileMoneyNotifyUrl(provider: 'cinetpay' | 'paydunya'): string {
  const origin = process.env.API_PUBLIC_ORIGIN ?? process.env.BACKEND_PUBLIC_ORIGIN ?? '';
  if (!origin) {
    throw new ServiceUnavailableException('API_PUBLIC_ORIGIN is required for Mobile Money provider callbacks.');
  }

  return `${origin.replace(/\/$/, '')}/api/payments/webhooks/${provider}`;
}
