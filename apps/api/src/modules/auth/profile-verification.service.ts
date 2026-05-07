import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailNotificationService } from '../support/email-notification.service';
import { ProfileVerificationAction } from './dto/profile-verification.dto';

@Injectable()
export class ProfileVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  async requestCode(input: { userId: string; email: string; action: ProfileVerificationAction }): Promise<{ ok: true }> {
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
        expiresAt: this.expiresAt(),
      },
      update: {
        code,
        expiresAt: this.expiresAt(),
      },
    });

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
      console.error('Profile verification email failed:', message);
      throw new ServiceUnavailableException(`Unable to send profile verification email. ${message}`);
    }

    return { ok: true };
  }

  async verifyCode(input: { userId: string; action: ProfileVerificationAction; code: string }): Promise<{ ok: true }> {
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

    await this.deleteCode(input.userId, input.action);
    return { ok: true };
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
