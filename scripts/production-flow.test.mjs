import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function expectIncludes(content, expected, label = expected) {
  assert.ok(content.includes(expected), `Expected ${label}`);
}

function expectMatches(content, pattern, label = String(pattern)) {
  assert.match(content, pattern, `Expected ${label}`);
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test('keeps durable database models for customer operations', () => {
    const schema = read('apps/api/prisma/schema.prisma');
    [
      'model User',
      'model Session',
      'model GerberUpload',
      'model GerberAnalysis',
      'model Quote',
      'model Order',
      'model Payment',
      'model PaymentEvent',
      'model SupportTicket',
      'model AdminAuditLog',
      'model Notification',
      'model ProfileVerificationCode',
      'model PasswordResetToken',
    ].forEach((model) => expectIncludes(schema, model));

    [
      'apps/api/prisma/migrations/20260507222000_persist_support_tickets/migration.sql',
      'apps/api/prisma/migrations/20260507224000_persist_admin_audit_logs/migration.sql',
      'apps/api/prisma/migrations/20260507225500_persist_notifications/migration.sql',
      'apps/api/prisma/migrations/20260508083000_persist_profile_verification_codes/migration.sql',
      'apps/api/prisma/migrations/20260508100000_add_password_reset_tokens/migration.sql',
    ].forEach((path) => assert.ok(existsSync(join(root, path)), `Expected migration ${path}`));
});

test('protects API routes with security headers and rate limits', () => {
    const middleware = read('apps/api/src/common/middleware/security.middleware.ts');
    [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Content-Security-Policy',
      'Too many requests',
    ].forEach((header) => expectIncludes(middleware, header));

    [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/profile-verification',
      '/uploads',
      '/payments',
      '/tracking',
    ].forEach((path) => expectIncludes(middleware, path));

    const main = read('apps/api/src/main.ts');
    expectIncludes(main, 'SecurityMiddleware');
    expectIncludes(main, 'app.use(new SecurityMiddleware().use)');
});

test('supports real password reset from request to frontend form', () => {
    const service = read('apps/api/src/modules/auth/auth.service.ts');
    [
      'passwordResetToken.create',
      'sendPasswordResetLink',
      'hashResetToken',
      'passwordResetToken.findUnique',
      'usersService.updatePassword',
      'sessionRepository.revokeAllForUser',
      "new URL('/reset-password'",
    ].forEach((text) => expectIncludes(service, text));

    const controller = read('apps/api/src/modules/auth/auth.controller.ts');
    expectIncludes(controller, "@Post('forgot-password')");
    expectIncludes(controller, "@Post('reset-password')");

    const resetPage = read('apps/web/app/reset-password/page.tsx');
    expectIncludes(resetPage, 'authApiContract.resetPassword.path');
    expectIncludes(resetPage, 'Nouveau mot de passe');
    expectIncludes(resetPage, 'autoComplete="new-password"');

    const contract = read('apps/web/lib/auth-contract.ts');
    expectIncludes(contract, 'ResetPasswordRequest');
    expectIncludes(contract, "path: '/api/auth/reset-password'");
});

test('creates customer notifications on core journey events', () => {
    const expectations = [
      ['apps/api/src/modules/payments/webhooks/payment-webhook.handler.ts', ['payment.succeeded', 'payment.failed']],
      ['apps/api/src/modules/tracking/tracking.service.ts', ['order.status.updated', 'order.tracking.updated']],
      ['apps/api/src/modules/support/support.service.ts', ['support.ticket.created']],
      ['apps/api/src/modules/pricing/pricing.service.ts', ['quote.created']],
      ['apps/api/src/modules/uploads/uploads.service.ts', ['gerber.analysis.completed']],
    ];

    for (const [path, markers] of expectations) {
      const content = read(path);
      expectIncludes(content, 'notificationsService.create', `${path} creates notifications`);
      markers.forEach((marker) => expectIncludes(content, marker, `${path} marker ${marker}`));
    }
});

test('keeps support, audit, notifications, and email codes out of volatile memory', () => {
    const durableFiles = [
      'apps/api/src/modules/support/repositories/support-ticket.repository.ts',
      'apps/api/src/modules/admin/repositories/admin-audit.repository.ts',
      'apps/api/src/modules/notifications/repositories/notification.repository.ts',
      'apps/api/src/modules/auth/profile-verification.service.ts',
    ];

    for (const path of durableFiles) {
      const content = read(path);
      expectIncludes(content, 'PrismaService', `${path} uses Prisma`);
      assert.doesNotMatch(content, /new Map|private readonly \w+\s*=\s*\[\]/, `${path} should not use in-memory stores`);
    }
});

test('keeps order, quote, upload, payment, support, and tracking routes available', () => {
    const files = {
      'apps/api/src/modules/auth/auth.controller.ts': ["@Post('register')", "@Post('login')"],
      'apps/api/src/modules/uploads/uploads.controller.ts': ["@Post('direct')", "@Get(':uploadId/analysis')"],
      'apps/api/src/modules/pricing/pricing.controller.ts': ["@Post('quote')"],
      'apps/api/src/modules/orders/orders.controller.ts': ["@Post()", "@Get()"],
      'apps/api/src/modules/payments/payments.controller.ts': ["@Post('checkout')", "@Post('mobile-money')", "@Post('webhooks/stripe')"],
      'apps/api/src/modules/tracking/tracking.controller.ts': ["@Get(':orderId')", "@Post('lookup')"],
      'apps/api/src/modules/support/support.controller.ts': ["@Post('tickets')", "@Post('contact')"],
      'apps/api/src/modules/notifications/notifications.controller.ts': ['@Get()', "@Patch(':id/read')"],
    };

    for (const [path, markers] of Object.entries(files)) {
      const content = read(path);
      markers.forEach((marker) => expectIncludes(content, marker, `${path} has ${marker}`));
    }
});

test('persists public profiles, projects, favorites, and social counters', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  [
    'promoCode       String?   @unique',
    'publicDescription String?',
    'model ExplorerProject',
    'model ExplorerProjectLike',
    'model UserFollow',
  ].forEach((marker) => expectIncludes(schema, marker));

  assert.ok(
    existsSync(join(root, 'apps/api/prisma/migrations/20260619120000_persist_public_profiles/migration.sql')),
    'Expected public profile migration',
  );

  const usersController = read('apps/api/src/modules/users/users.controller.ts');
  expectIncludes(usersController, "@Get('me/public-profile')");
  expectIncludes(usersController, "@Put('me/public-profile')");

  const explorerController = read('apps/api/src/modules/explorer/explorer.controller.ts');
  expectIncludes(explorerController, "@Get('me/projects')");
  expectIncludes(explorerController, "@Get('me/favorites')");

  const profilePage = read('apps/web/app/profile/page.tsx');
  expectIncludes(profilePage, '/api/users/me/public-profile');
  expectIncludes(profilePage, '/api/explorer/me/projects');
  expectIncludes(profilePage, '/api/explorer/me/favorites');
  expectIncludes(profilePage, '/api/explorer/projects');
});

test('keeps deployment checks wired to build, migrate, and run production paths', () => {
    const packageJson = JSON.parse(read('package.json'));
    assert.equal(packageJson.scripts['web:build'], 'node --max-old-space-size=8192 node_modules/next/dist/bin/next build apps/web');
    assert.equal(packageJson.scripts['api:prod:build'], 'npm run db:generate && npm run api:build');
    assert.equal(packageJson.scripts['api:deploy:start'], 'npm run db:deploy && npm run api:start:prod');
    assert.equal(packageJson.scripts['test:production-flow'], 'node scripts/production-flow.test.mjs');

    const render = read('render.yaml');
    expectIncludes(render, 'npm run api:prod:build');
    expectIncludes(render, 'npm run api:deploy:start');
    expectIncludes(render, 'STRIPE_WEBHOOK_SECRET');
    expectIncludes(render, 'S3_BUCKET');
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failed > 0) {
  console.error(`${failed} production-flow test(s) failed.`);
  process.exit(1);
}

console.log(`${tests.length} production-flow tests passed.`);
