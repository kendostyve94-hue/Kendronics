import { Injectable } from '@nestjs/common';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async create(input: { userId: string; email: string; refreshToken: string }): Promise<Session> {
    const session: Session = {
      id: crypto.randomUUID(),
      userId: input.userId,
      email: input.email,
      refreshTokenHash: input.refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findValidSession(refreshToken: string): Promise<Session | null> {
    return (
      [...this.sessions.values()].find(
        (session) =>
          session.refreshTokenHash === refreshToken &&
          !session.revokedAt &&
          session.expiresAt.getTime() > Date.now(),
      ) ?? null
    );
  }

  async revoke(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      session.revokedAt = new Date();
    }
  }
}
