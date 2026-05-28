import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailNotificationService } from '../support/email-notification.service';
import { UsersService } from '../users/users.service';
import { ProfileVerificationAction } from './dto/profile-verification.dto';

@Injectable()
export class ProfileVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async requestCode(input: { userId: string; email: string; action: ProfileVerificationAction; metadata?: Prisma.InputJsonValue }): Promise<{ ok: true }> {
    if (!input.email) {
      throw new BadRequestException('Account email is required before verification.');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.prisma.profileVerificationCode.upsert({
      where: {
        userId_action: {
          userId: input.userId,
          action: input.action,
        },
      },
      create: {
        userId: input.userId,
        action: input.action,
        code,
        metadata: input.metadata,
        expiresAt: this.expiresAt(),
      },
      update: {
        code,
        metadata: input.metadata,
        expiresAt: this.expiresAt(),
      },
    });

    await this.notificationsService.deleteSensitiveForUser(input.userId);
    await this.notificationsService.sendEphemeral({
      userId: input.userId,
      type: `verification.${input.action}.code`,
      title: 'Code de verification Kendronics',
      body: `Code ${code} pour ${labelForAction(input.action).toLowerCase()}. Il expire dans 10 minutes.`,
    });

    if (shouldAwaitVerificationEmail()) {
      try {
        await this.emailNotificationService.sendProfileVerificationCode({
          to: input.email,
          code,
          action: input.action,
        });
      } catch (error) {
        await this.deleteCode(input.userId, input.action);
        if (error instanceof ServiceUnavailableException) throw error;
        const message = smtpErrorDetails(error);
        throw new ServiceUnavailableException(`Unable to send profile verification email. ${message}`);
      }
    } else {
      void this.emailNotificationService.sendProfileVerificationCode({
        to: input.email,
        code,
        action: input.action,
      }).catch((error) => {
        console.warn('Profile verification email fallback failed:', smtpErrorDetails(error));
      });
    }

    return { ok: true };
  }

  async verifyCode(input: { userId: string; action: ProfileVerificationAction; code: string }): Promise<{ ok: true; metadata?: Record<string, unknown> }> {
    const record = await this.prisma.profileVerificationCode.findUnique({
      where: {
        userId_action: {
          userId: input.userId,
          action: input.action,
        },
      },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      await this.deleteCode(input.userId, input.action);
      throw new BadRequestException('Verification code expired or missing.');
    }

    if (record.code !== input.code.trim()) {
      throw new BadRequestException('Invalid verification code.');
    }

    const metadata = objectValue(record.metadata);
    await this.deleteCode(input.userId, input.action);
    if (input.action === 'account') {
      await this.usersService.markEmailVerified(input.userId);
    }
    return { ok: true, metadata };
  }

  private expiresAt(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  private async deleteCode(userId: string, action: ProfileVerificationAction): Promise<void> {
    await this.prisma.profileVerificationCode.deleteMany({
      where: { userId, action },
    });
  }
}

function smtpErrorDetails(error: unknown): string {
  if (error instanceof AggregateError) {
    const details = error.errors
      .map((entry) => (entry instanceof Error ? `${entry.name}: ${entry.message}` : String(entry)))
      .join(' | ');

    return details || error.message || 'Aggregate SMTP connection error';
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error || 'Unknown SMTP error');
}

function labelForAction(action: string) {
  if (action === 'account') return 'Modification du compte';
  if (action === 'contacts') return 'Changement des contacts';
  if (action === 'email_change') return "Changement d'e-mail";
  if (action === 'password_change') return 'Changement du mot de passe';
  if (action === 'delete') return 'Suppression du compte';
  return 'Verification du compte';
}

function shouldAwaitVerificationEmail(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERIFICATION_CODE_EMAIL_REQUIRED === 'true';
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
