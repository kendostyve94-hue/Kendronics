import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

interface OAuthStatePayload {
  nonce: string;
  provider: 'google';
  exp: number;
}

@Injectable()
export class OAuthStateService {
  create(provider: OAuthStatePayload['provider']): string {
    const payload: OAuthStatePayload = {
      nonce: randomBytes(16).toString('hex'),
      provider,
      exp: Date.now() + 10 * 60 * 1000,
    };
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verify(state: string, provider: OAuthStatePayload['provider']) {
    const [encodedPayload, signature] = state.split('.');
    if (!encodedPayload || !signature) {
      throw new BadRequestException('Invalid OAuth state.');
    }

    const expectedSignature = this.sign(encodedPayload);
    if (!this.safeEquals(signature, expectedSignature)) {
      throw new BadRequestException('Invalid OAuth state.');
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (payload.provider !== provider || payload.exp < Date.now()) {
      throw new BadRequestException('Expired OAuth state.');
    }
  }

  private sign(value: string): string {
    const secret = process.env.JWT_SECRET ?? 'local-development-secret-change-before-production';
    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
  }
}
