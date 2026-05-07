import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CookieConsent } from '../entities/cookie-consent.entity';

@Injectable()
export class CookieConsentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestByUserId(userId: string): Promise<CookieConsent | null> {
    const consent = await this.prisma.cookieConsent.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return consent ? this.toCookieConsent(consent) : null;
  }

  async upsert(input: {
    userId: string;
    version: string;
    analytics: boolean;
    preferences: boolean;
    source?: string;
  }): Promise<CookieConsent> {
    const consent = await this.prisma.cookieConsent.upsert({
      where: {
        userId_version: {
          userId: input.userId,
          version: input.version,
        },
      },
      create: {
        userId: input.userId,
        version: input.version,
        necessary: true,
        analytics: input.analytics,
        preferences: input.preferences,
        source: input.source ?? 'web',
      },
      update: {
        necessary: true,
        analytics: input.analytics,
        preferences: input.preferences,
        source: input.source ?? 'web',
      },
    });

    return this.toCookieConsent(consent);
  }

  private toCookieConsent(consent: {
    id: string;
    userId: string;
    version: string;
    necessary: boolean;
    analytics: boolean;
    preferences: boolean;
    source: string;
    createdAt: Date;
    updatedAt: Date;
  }): CookieConsent {
    return {
      ...consent,
      necessary: true,
    };
  }
}
