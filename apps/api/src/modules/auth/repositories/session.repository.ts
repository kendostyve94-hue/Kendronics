import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthTokenService } from '../auth-token.service';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async create(input: { userId: string; email: string; refreshToken: string }): Promise<Session> {
    const session = await this.prisma.session.create({
      data: {
        userId: input.userId,
        email: input.email,
        refreshTokenHash: this.authTokenService.hashToken(input.refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return this.toSession(session);
  }

  async findValidSession(refreshToken: string): Promise<Session | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: this.authTokenService.hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return session ? this.toSession(session) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        refreshTokenHash: this.authTokenService.hashToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  private toSession(session: {
    id: string;
    userId: string;
    email: string;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }): Session {
    return {
      id: session.id,
      userId: session.userId,
      email: session.email,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt ?? undefined,
    };
  }
}
