import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    // Replace this placeholder with Passport/JWT verification in the auth module.
    request.user = {
      id: 'current-user-id',
      email: 'user@example.com',
      roles: ['user'],
    };

    return true;
  }
}
