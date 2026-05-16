import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

type AdminAccessPayload = {
  sub: string;
  username: string;
  exp: number;
};

@Injectable()
export class AdminTotpService {
  isRequired(): boolean {
    return process.env.ADMIN_TOTP_REQUIRED?.trim().toLowerCase() === 'true';
  }

  verifyCode(user: AuthenticatedUser, username: string, code: string): { accessToken: string; expiresAt: string } {
    const normalizedUsername = username.trim().toLowerCase();
    const allowedUsernames = [user.email.toLowerCase(), user.email.split('@')[0]?.toLowerCase()].filter(Boolean);
    if (!allowedUsernames.includes(normalizedUsername)) {
      throw new ForbiddenException('Admin username does not match the signed-in account.');
    }

    const secret = this.secretForUsername(normalizedUsername) ?? this.secretForUsername(user.email.toLowerCase());
    if (!secret) {
      throw new ForbiddenException('Admin TOTP secret is not configured for this account.');
    }

    if (!this.verifyTotp(secret, code)) {
      throw new UnauthorizedException('Invalid admin authenticator code.');
    }

    const ttlSeconds = Number(process.env.ADMIN_TOTP_SESSION_TTL_SECONDS ?? 900);
    const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds);
    const accessToken = this.sign({ sub: user.id, username: normalizedUsername, exp });
    return { accessToken, expiresAt: new Date(exp * 1000).toISOString() };
  }

  verifyAccessToken(user: AuthenticatedUser, token: string | undefined): void {
    if (!this.isRequired()) return;
    if (!token) {
      throw new ForbiddenException('Admin verification code is required.');
    }

    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      throw new ForbiddenException('Invalid admin verification session.');
    }

    const expectedSignature = this.signature(encodedPayload);
    if (!this.constantTimeEqual(signature, expectedSignature)) {
      throw new ForbiddenException('Invalid admin verification session.');
    }

    let payload: AdminAccessPayload;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as AdminAccessPayload;
    } catch {
      throw new ForbiddenException('Invalid admin verification session.');
    }

    if (payload.sub !== user.id || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new ForbiddenException('Admin verification session expired.');
    }
  }

  private secretForUsername(username: string): string | undefined {
    const secrets = this.configuredSecrets();
    return secrets[username.toLowerCase()];
  }

  private configuredSecrets(): Record<string, string> {
    const raw = process.env.ADMIN_TOTP_SECRETS?.trim();
    if (!raw) return {};

    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw) as Record<string, string>;
        return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key.trim().toLowerCase(), String(value).trim()]));
      } catch {
        return {};
      }
    }

    return Object.fromEntries(
      raw
        .split(',')
        .map((pair) => pair.trim())
        .filter(Boolean)
        .map((pair) => {
          const [key, ...valueParts] = pair.split(':');
          return [key.trim().toLowerCase(), valueParts.join(':').trim()];
        })
        .filter(([key, value]) => key && value),
    );
  }

  private verifyTotp(secret: string, code: string): boolean {
    const normalizedCode = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalizedCode)) return false;

    const timestep = Math.floor(Date.now() / 1000 / 30);
    return [-1, 0, 1].some((offset) => this.constantTimeEqual(normalizedCode, this.totp(secret, timestep + offset)));
  }

  private totp(secret: string, timestep: number): string {
    const key = decodeBase32(secret);
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(timestep));
    const hmac = createHmac('sha1', key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
    return String(binary % 1_000_000).padStart(6, '0');
  }

  private sign(payload: AdminAccessPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encodedPayload}.${this.signature(encodedPayload)}`;
  }

  private signature(value: string): string {
    return createHmac('sha256', `${process.env.JWT_SECRET ?? 'development-only-change-me'}:admin-totp`).update(value).digest('base64url');
  }

  private constantTimeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}

function decodeBase32(value: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = value.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let bitLength = 0;

  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index < 0) continue;
    bits = (bits << 5) | index;
    bitLength += 5;
    if (bitLength >= 8) {
      bytes.push((bits >> (bitLength - 8)) & 0xff);
      bitLength -= 8;
    }
  }

  return Buffer.from(bytes);
}
