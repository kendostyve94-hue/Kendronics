import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from '../../modules/auth/auth-token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const authorization = request.headers.authorization;
    const cookieToken = cookieValue(request.headers.cookie, 'kendronics_access_token');
    const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : undefined;
    const token = bearerToken || cookieToken;

    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    request.user = this.authTokenService.verifyAccessToken(token);
    return true;
  }
}

function cookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .map((part) => {
      const separator = part.indexOf('=');
      return separator === -1 ? [part, ''] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
    })
    .find(([key]) => key === name)?.[1];
}
