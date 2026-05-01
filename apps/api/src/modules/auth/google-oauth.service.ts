import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthTokens } from './entities/auth-tokens.entity';
import { AuthService } from './auth.service';
import { OAuthStateService } from './oauth-state.service';

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  email?: string;
  email_verified?: boolean;
  name?: string;
}

@Injectable()
export class GoogleOAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthStateService: OAuthStateService,
  ) {}

  createAuthorizationUrl(): string {
    const clientId = this.requiredEnv('GOOGLE_OAUTH_CLIENT_ID');
    const redirectUri = this.requiredEnv('GOOGLE_OAUTH_REDIRECT_URI');
    const state = this.oauthStateService.create('google');
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  }

  async handleCallback(input: { code?: string; state?: string }): Promise<AuthTokens> {
    if (!input.code || !input.state) {
      throw new BadRequestException('Missing OAuth callback parameters.');
    }

    this.oauthStateService.verify(input.state, 'google');
    const token = await this.exchangeCode(input.code);
    if (!token.access_token) {
      throw new BadRequestException('Google OAuth token exchange failed.');
    }

    const profile = await this.fetchProfile(token.access_token);
    if (!profile.email || profile.email_verified === false) {
      throw new BadRequestException('Google account email is not verified.');
    }

    return this.authService.loginWithOAuth({
      email: profile.email,
      fullName: profile.name,
    });
  }

  private async exchangeCode(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.requiredEnv('GOOGLE_OAUTH_CLIENT_ID'),
        client_secret: this.requiredEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
        redirect_uri: this.requiredEnv('GOOGLE_OAUTH_REDIRECT_URI'),
        grant_type: 'authorization_code',
      }),
    });
    const payload = (await response.json()) as GoogleTokenResponse;
    if (!response.ok || payload.error) {
      throw new BadRequestException(payload.error_description || 'Google OAuth token exchange failed.');
    }
    return payload;
  }

  private async fetchProfile(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new BadRequestException('Google profile request failed.');
    }
    return (await response.json()) as GoogleUserInfo;
  }

  private requiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new BadRequestException(`${key} is not configured.`);
    }
    return value;
  }
}
