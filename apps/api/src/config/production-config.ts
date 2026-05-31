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

  if (process.env.STRIPE_IDENTITY_ENABLED === 'true') {
    const missingStripeIdentity = ['STRIPE_SECRET_KEY', 'STRIPE_IDENTITY_WEBHOOK_SECRET'].filter((key) => !process.env[key]);
    if (missingStripeIdentity.length > 0) {
      throw new Error(`Missing Stripe Identity production environment variables: ${missingStripeIdentity.join(', ')}`);
    }
    if (process.env.STRIPE_IDENTITY_WEBHOOK_SECRET && !process.env.STRIPE_IDENTITY_WEBHOOK_SECRET.startsWith('whsec_')) {
      throw new Error('STRIPE_IDENTITY_WEBHOOK_SECRET must be a Stripe webhook signing secret.');
    }
  }

  if (process.env.ONESIGNAL_REQUIRED === 'true') {
    const missingOneSignal = ['ONESIGNAL_APP_ID', 'ONESIGNAL_REST_API_KEY'].filter((key) => !process.env[key]);
    if (missingOneSignal.length > 0) {
      throw new Error(`Missing OneSignal production environment variables: ${missingOneSignal.join(', ')}`);
    }
  }

  if (process.env.MONDAY_REQUIRED === 'true') {
    const missingMonday = [
      'MONDAY_API_KEY',
      'MONDAY_BOARD_COMMANDES_ID',
      'MONDAY_BOARD_CHIFFRE_AFFAIRE_LIVE_ID',
      'MONDAY_BOARD_EN_PRODUCTION_ID',
      'MONDAY_BOARD_LOGISTICS_INTERNATIONAL_ID',
      'MONDAY_BOARD_LOGISTIQUE_LOCALE_ID',
      'MONDAY_BOARD_SUPPORT_CLIENTS_ID',
    ].filter((key) => !process.env[key]);
    if (missingMonday.length > 0) {
      throw new Error(`Missing Monday production environment variables: ${missingMonday.join(', ')}`);
    }
  }

  if (process.env.PHONE_VERIFY_PROVIDER === 'dev') {
    throw new Error('PHONE_VERIFY_PROVIDER=dev is not allowed in production.');
  }

  if (process.env.MOBILE_MONEY_PROVIDER === 'simulated') {
    throw new Error('MOBILE_MONEY_PROVIDER=simulated is not allowed in production.');
  }

  if (process.env.REQUIRE_SUPPLIER_REVIEW_ENDPOINT === 'true') {
    const preferredSupplier = (process.env.PREFERRED_PCB_SUPPLIER ?? 'jlcpcb').toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const missingSupplier = [`${preferredSupplier}_API_KEY`, `${preferredSupplier}_REVIEW_ENDPOINT`].filter((key) => !process.env[key]);
    if (missingSupplier.length > 0) {
      throw new Error(`Missing supplier review production environment variables: ${missingSupplier.join(', ')}`);
    }
  }
}
