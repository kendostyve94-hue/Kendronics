import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailNotificationService } from '../support/email-notification.service';

export type TrustLevelName = 'UNVERIFIED' | 'ACCOUNT_VERIFIED' | 'IDENTITY_VERIFIED' | 'BUSINESS_VERIFIED';

export type VerificationStatusPayload = {
  level: number;
  levelName: TrustLevelName;
  status: string;
  riskScore: number;
  checklist: {
    emailVerified: boolean;
    phoneVerified: boolean;
    countryConfirmed: boolean;
    addressAdded: boolean;
    cguAccepted: boolean;
    identityVerified: boolean;
    businessVerified: boolean;
    mfaEnabled: boolean;
  };
  missingSteps: string[];
};

@Injectable()
export class VerificationLevelService {
  private readonly logger = new Logger(VerificationLevelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  async getStatus(userId: string): Promise<VerificationStatusPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identityVerifications: { orderBy: { startedAt: 'desc' }, take: 1 },
        businessVerifications: { orderBy: { createdAt: 'desc' }, take: 1 },
        mfaFactors: { where: { enabled: true }, take: 1 },
      },
    });
    if (!user) {
      return emptyStatus();
    }

    const shippingAddress = objectValue(user.shippingAddress);
    const latestIdentity = user.identityVerifications[0];
    const latestBusiness = user.businessVerifications[0];
    const checklist = {
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      countryConfirmed: Boolean(user.country?.trim()),
      addressAdded: hasCompleteAddress(shippingAddress),
      cguAccepted: Boolean(user.cguAcceptedAt),
      identityVerified: latestIdentity?.status === 'verified',
      businessVerified: latestBusiness?.status === 'verified',
      mfaEnabled: user.mfaEnabled || user.mfaFactors.length > 0,
    };

    const level = calculateLevel(checklist);
    const status = latestIdentity?.status === 'requires_manual_review' || latestBusiness?.status === 'manual_review'
      ? 'manual_review'
      : latestIdentity?.status === 'failed' || latestBusiness?.status === 'rejected'
        ? 'rejected'
        : level === 0
          ? 'unverified'
          : 'verified';

    const previousLevel = user.verificationLevel ?? 0;

    await this.prisma.user.update({
      where: { id: userId },
      data: { verificationLevel: level, verificationStatus: status, mfaEnabled: checklist.mfaEnabled },
    });

    if (previousLevel < 1 && level >= 1) {
      await this.notifyAccountVerified(userId, user.email);
    }

    return {
      level,
      levelName: levelName(level),
      status,
      riskScore: user.riskScore,
      checklist,
      missingSteps: missingSteps(checklist),
    };
  }

  async evaluateOrder(userId: string, amount: number): Promise<{ allowed: boolean; requiredVerificationLevel: TrustLevelName; missingSteps: string[]; riskScore: number }> {
    const status = await this.getStatus(userId);
    const requiredLevel = requiredLevelForAmount(amount, status.riskScore);
    return {
      allowed: status.level >= requiredLevel,
      requiredVerificationLevel: levelName(requiredLevel),
      missingSteps: status.level >= requiredLevel ? [] : status.missingSteps,
      riskScore: status.riskScore,
    };
  }

  private async notifyAccountVerified(userId: string, email: string): Promise<void> {
    await this.prisma.userAuditLog.create({
      data: {
        userId,
        actorId: userId,
        eventType: 'account.verified.level1',
        metadataJson: { verificationLevel: 1, verificationStatus: 'verified' },
      },
    });

    await this.notificationsService.create({
      userId,
      type: 'account.verified.level1',
      title: 'Compte verifie',
      body: 'Votre compte est maintenant verifie. Vous pouvez soumettre une commande selon les conditions d utilisation Kendronics.',
    });

    if (!isInternalPhoneAccountEmail(email)) {
      try {
        await this.emailNotificationService.sendSecurityNotice({
          to: email,
          subject: 'Compte verifie',
          lines: [
            'Bonjour,',
            '',
            'Votre compte Kendronics est maintenant verifie.',
            'Vous pouvez soumettre une commande selon les conditions d utilisation Kendronics.',
            '',
            `${frontendOrigin()}/conditions`,
          ],
        });
      } catch (error) {
        this.logger.warn(`Account verification email failed for ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

function calculateLevel(checklist: VerificationStatusPayload['checklist']) {
  const level1 = checklist.emailVerified && checklist.phoneVerified && checklist.countryConfirmed && checklist.addressAdded && checklist.cguAccepted;
  if (!level1) return 0;
  if (checklist.businessVerified) return 3;
  if (checklist.identityVerified) return 2;
  return 1;
}

function requiredLevelForAmount(amount: number, riskScore: number) {
  if (amount >= 300) return 2;
  if (amount >= 100 && riskScore >= 70) return 2;
  return 1;
}

function levelName(level: number): TrustLevelName {
  if (level >= 3) return 'BUSINESS_VERIFIED';
  if (level >= 2) return 'IDENTITY_VERIFIED';
  if (level >= 1) return 'ACCOUNT_VERIFIED';
  return 'UNVERIFIED';
}

function missingSteps(checklist: VerificationStatusPayload['checklist']) {
  return Object.entries({
    email_verification: checklist.emailVerified,
    phone_verification: checklist.phoneVerified,
    country_confirmation: checklist.countryConfirmed,
    shipping_address: checklist.addressAdded,
    terms_acceptance: checklist.cguAccepted,
  }).filter(([, done]) => !done).map(([step]) => step);
}

function hasCompleteAddress(address: Record<string, unknown> | undefined) {
  return Boolean(address?.street && address?.country && address?.city && address?.phone);
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function isInternalPhoneAccountEmail(email: string): boolean {
  return email.endsWith('@kendronics.local');
}

function frontendOrigin(): string {
  return process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://kendronics.com';
}

function emptyStatus(): VerificationStatusPayload {
  return {
    level: 0,
    levelName: 'UNVERIFIED',
    status: 'unverified',
    riskScore: 0,
    checklist: {
      emailVerified: false,
      phoneVerified: false,
      countryConfirmed: false,
      addressAdded: false,
      cguAccepted: false,
      identityVerified: false,
      businessVerified: false,
      mfaEnabled: false,
    },
    missingSteps: ['email_verification', 'phone_verification', 'country_confirmation', 'shipping_address', 'terms_acceptance'],
  };
}
