import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailNotificationService } from '../support/email-notification.service';
import { VerificationLevelService } from './verification-level.service';

@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly verificationLevelService: VerificationLevelService,
  ) {
    this.webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion,
        })
      : null;
  }

  async start(userId: string): Promise<{ provider: 'stripe_identity'; sessionId: string; url: string; status: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found.');
    if (!this.stripe) {
      if (process.env.NODE_ENV === 'production' || process.env.STRIPE_IDENTITY_ENABLED === 'true') {
        throw new ServiceUnavailableException('Stripe Identity is not configured.');
      }
      const sessionId = `vs_sim_${userId}_${Date.now()}`;
      await this.prisma.identityVerification.create({
        data: {
          userId,
          provider: 'stripe_identity',
          providerSessionId: sessionId,
          providerClientReferenceId: userId,
          status: 'pending',
        },
      });
      return { provider: 'stripe_identity', sessionId, url: `${frontendOrigin()}/profile?view=settings`, status: 'pending' };
    }

    const session = await this.stripe.identity.verificationSessions.create({
      type: 'document',
      return_url: `${frontendOrigin()}/profile?view=settings&identity=returned`,
      metadata: {
        userId,
      },
      options: {
        document: {
          require_matching_selfie: process.env.STRIPE_IDENTITY_REQUIRE_SELFIE !== 'false',
        },
      },
    });

    await this.prisma.identityVerification.create({
      data: {
        userId,
        provider: 'stripe_identity',
        providerSessionId: session.id,
        providerClientReferenceId: userId,
        status: normalizeStripeIdentityStatus(session.status),
        rawProviderResultJson: safeStripeIdentityPayload(session) as Prisma.InputJsonValue,
      },
    });

    if (!session.url) {
      throw new ServiceUnavailableException('Stripe Identity did not return a verification URL.');
    }

    await this.notificationsService.create({
      userId,
      type: 'identity.verification.started',
      title: 'Verification identite demarree',
      body: 'La verification securisee de votre identite a ete ouverte.',
    });

    return { provider: 'stripe_identity', sessionId: session.id, url: session.url, status: normalizeStripeIdentityStatus(session.status) };
  }

  async status(userId: string) {
    const latest = await this.prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
    const account = await this.verificationLevelService.getStatus(userId);
    return {
      identityVerification: latest
        ? {
            provider: latest.provider,
            status: latest.status,
            startedAt: latest.startedAt,
            completedAt: latest.completedAt,
            mismatchReason: latest.mismatchReason,
          }
        : null,
      account,
    };
  }

  async handleWebhook(signature: string | undefined, rawBody: Buffer | undefined, parsedBody: unknown) {
    if (!signature) throw new BadRequestException('Missing Stripe Identity signature.');
    const event = this.verifyWebhook(signature, rawBody, parsedBody);
    if (!event.type.startsWith('identity.verification_session.')) {
      return { received: true, ignored: true };
    }

    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = stringValue(session.metadata?.userId) ?? stringValue(session.client_reference_id);
    if (!userId) {
      this.logger.warn(`Stripe Identity session ${session.id} has no userId metadata.`);
      return { received: true, ignored: true };
    }

    const status = normalizeStripeIdentityStatus(session.status);
    const verifiedOutputs = objectValue(session.verified_outputs);
    const verifiedName = [verifiedOutputs.first_name, verifiedOutputs.last_name].filter((value) => typeof value === 'string' && value.trim()).join(' ');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const mismatchReason = status === 'verified' && user && verifiedName && !nameLooksCompatible(user.fullName, verifiedName)
      ? `Verified name "${verifiedName}" does not match account name "${user.fullName}".`
      : undefined;
    const finalStatus = mismatchReason ? 'requires_manual_review' : status;

    const existing = await this.prisma.identityVerification.findFirst({ where: { providerSessionId: session.id } });
    const data = {
      status: finalStatus,
      documentType: stringValue(verifiedOutputs.document_type),
      country: stringValue(verifiedOutputs.address_country),
      verifiedName: verifiedName || undefined,
      mismatchReason,
      rawProviderResultJson: safeStripeIdentityPayload(session) as Prisma.InputJsonValue,
      completedAt: isFinalStatus(finalStatus) ? new Date() : undefined,
    };

    if (existing) {
      await this.prisma.identityVerification.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await this.prisma.identityVerification.create({
        data: {
        userId,
        provider: 'stripe_identity',
        providerSessionId: session.id,
        providerClientReferenceId: userId,
        ...data,
        },
      });
    }

    const account = await this.verificationLevelService.getStatus(userId);
    await this.notifyResult(userId, user?.email, finalStatus);
    return { received: true, status: finalStatus, verificationLevel: account.level };
  }

  private verifyWebhook(signature: string, rawBody: Buffer | undefined, parsedBody: unknown): Stripe.Event {
    if (!this.stripe || !this.webhookSecret) {
      if (process.env.NODE_ENV === 'production' || process.env.STRIPE_IDENTITY_ENABLED === 'true') {
        throw new ServiceUnavailableException('Stripe Identity webhook is not configured.');
      }
      return parsedBody as Stripe.Event;
    }
    if (!rawBody) throw new BadRequestException('Stripe Identity raw body is required.');
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }

  private async notifyResult(userId: string, email: string | undefined, status: string): Promise<void> {
    const verified = status === 'verified';
    const review = status === 'requires_manual_review';
    await this.notificationsService.create({
      userId,
      type: verified ? 'identity.verified' : review ? 'identity.manual_review' : 'identity.failed',
      title: verified ? 'Identite certifiee' : review ? 'Verification en revue' : 'Verification identite non validee',
      body: verified
        ? 'Votre compte est maintenant certifie. Vous pouvez consulter votre statut dans votre profil.'
        : review
          ? 'Votre verification doit etre controlee manuellement avant certification.'
          : 'Votre verification identite n a pas ete validee. Vous pouvez reessayer ou contacter le support.',
    });

    if (!email || email.endsWith('@kendronics.local')) return;
    try {
      await this.emailNotificationService.sendSecurityNotice({
        to: email,
        subject: verified ? 'Compte Kendronics certifie' : 'Verification identite Kendronics',
        lines: [
          'Bonjour,',
          '',
          verified
            ? 'Votre verification identite est validee. Votre compte Kendronics est maintenant certifie.'
            : review
              ? 'Votre verification identite est en revue manuelle.'
              : 'Votre verification identite n a pas pu etre validee.',
          '',
          `${frontendOrigin()}/profile?view=settings`,
        ],
      });
    } catch (error) {
      this.logger.warn(`Identity verification email failed for ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function normalizeStripeIdentityStatus(status: string): string {
  if (status === 'verified') return 'verified';
  if (status === 'processing') return 'processing';
  if (status === 'requires_input') return 'failed';
  if (status === 'canceled') return 'failed';
  return 'pending';
}

function isFinalStatus(status: string): boolean {
  return ['verified', 'failed', 'requires_manual_review'].includes(status);
}

function safeStripeIdentityPayload(session: Stripe.Identity.VerificationSession): Record<string, unknown> {
  return {
    id: session.id,
    object: session.object,
    status: session.status,
    type: session.type,
    lastError: session.last_error,
    metadata: session.metadata,
    verifiedOutputs: session.verified_outputs,
  };
}

function nameLooksCompatible(accountName: string, verifiedName: string): boolean {
  const accountTokens = normalizeName(accountName).split(' ').filter(Boolean);
  const verifiedTokens = normalizeName(verifiedName).split(' ').filter(Boolean);
  if (accountTokens.length === 0 || verifiedTokens.length === 0) return false;
  return accountTokens.every((token) => verifiedTokens.includes(token)) || verifiedTokens.every((token) => accountTokens.includes(token));
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function frontendOrigin(): string {
  return process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim() ?? process.env.FRONTEND_URL ?? 'https://kendronics.com';
}
