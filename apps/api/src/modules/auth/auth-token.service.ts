import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UserRole } from '../../common/types/user-role.enum';

type JwtPayload = {
  sub: string;
  email: string;
  roles: UserRole[];
  exp: number;
};

@Injectable()
export class AuthTokenService {
  createAccessToken(user: AuthenticatedUser): string {
    const ttlSeconds = Number(process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ?? 900);
    return this.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    });
  }

  createRefreshToken(): string {
    return `refresh.${randomBytes(48).toString('base64url')}`;
  }

  hashToken(token: string): string {
    return createHmac('sha256', this.secret()).update(token).digest('base64url');
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid bearer token.');
    }

    const expectedSignature = this.signature(`${encodedHeader}.${encodedPayload}`);
    if (!this.constantTimeEqual(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid bearer token.');
    }

    let payload: JwtPayload;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid bearer token.');
    }
    if (!payload.sub || !payload.email || !Array.isArray(payload.roles)) {
      throw new UnauthorizedException('Invalid bearer token.');
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Expired bearer token.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }

  private sign(payload: JwtPayload): string {
    const encodedHeader = this.base64UrlJson({ alg: 'HS256', typ: 'JWT' });
    const encodedPayload = this.base64UrlJson(payload);
    const signature = this.signature(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private signature(value: string): string {
    return createHmac('sha256', this.secret()).update(value).digest('base64url');
  }

  private base64UrlJson(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private constantTimeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private secret(): string {
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production.');
    }

    return 'development-only-change-me';
  }
}
