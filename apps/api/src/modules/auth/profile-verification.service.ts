import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EmailNotificationService } from '../support/email-notification.service';
import { ProfileVerificationAction } from './dto/profile-verification.dto';

type VerificationRecord = {
  code: string;
  expiresAt: number;
};

@Injectable()
export class ProfileVerificationService {
  private readonly records = new Map<string, VerificationRecord>();

  constructor(private readonly emailNotificationService: EmailNotificationService) {}

  async requestCode(input: { userId: string; email: string; action: ProfileVerificationAction }): Promise<{ ok: true }> {
    if (!input.email) {
      throw new BadRequestException('Account email is required before verification.');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.records.set(this.keyFor(input.userId, input.action), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    try {
      await this.emailNotificationService.sendProfileVerificationCode({
        to: input.email,
        code,
        action: input.action,
      });
    } catch (error) {
      this.records.delete(this.keyFor(input.userId, input.action));
      if (error instanceof ServiceUnavailableException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      console.error('Profile verification email failed:', message);
      throw new ServiceUnavailableException(`Unable to send profile verification email. ${message}`);
    }

    return { ok: true };
  }

  verifyCode(input: { userId: string; action: ProfileVerificationAction; code: string }): { ok: true } {
    const key = this.keyFor(input.userId, input.action);
    const record = this.records.get(key);

    if (!record || record.expiresAt < Date.now()) {
      this.records.delete(key);
      throw new BadRequestException('Verification code expired or missing.');
    }

    if (record.code !== input.code.trim()) {
      throw new BadRequestException('Invalid verification code.');
    }

    this.records.delete(key);
    return { ok: true };
  }

  private keyFor(userId: string, action: ProfileVerificationAction) {
    return `${userId}:${action}`;
  }
}
