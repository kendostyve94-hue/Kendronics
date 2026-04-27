const productionOnlyRequiredEnv = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_ORIGIN',
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
}
