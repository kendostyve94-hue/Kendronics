import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AdminTotpService } from './admin-totp.service';

@Injectable()
export class AdminTotpGuard implements CanActivate {
  constructor(private readonly adminTotpService: AdminTotpService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      path?: string;
      route?: { path?: string };
      headers: Record<string, string | string[] | undefined>;
      user?: AuthenticatedUser;
    }>();

    const path = request.route?.path ?? request.path ?? '';
    if (path.includes('access/code/')) return true;

    const header = request.headers['x-admin-access-token'];
    const token = Array.isArray(header) ? header[0] : header;
    this.adminTotpService.verifyAccessToken(request.user as AuthenticatedUser, token);
    return true;
  }
}
