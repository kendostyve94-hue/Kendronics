const productionOnlyRequiredEnv = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_ORIGIN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const unsafeSecretValues = new Set(['replace-with-a-long-random-secret', 'development-only-change-me']);

export function validateProductionConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = productionOnlyRequiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
  }

  if (unsafeSecretValues.has(process.env.JWT_SECRET ?? '')) {
    throw new Error('JWT_SECRET must be a strong production secret.');
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY must be a Stripe secret key.');
  }

  if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    throw new Error('STRIPE_WEBHOOK_SECRET must be a Stripe webhook signing secret.');
  }

  if (process.env.ONESIGNAL_REQUIRED === 'true') {
    const missingOneSignal = ['ONESIGNAL_APP_ID', 'ONESIGNAL_REST_API_KEY'].filter((key) => !process.env[key]);
    if (missingOneSignal.length > 0) {
      throw new Error(`Missing OneSignal production environment variables: ${missingOneSignal.join(', ')}`);
    }
  }
}
