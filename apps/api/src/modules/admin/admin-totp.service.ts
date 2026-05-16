import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, pbkdf2Sync, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UserRole } from '../../common/types/user-role.enum';
import { EmailNotificationService } from '../support/email-notification.service';
import { AdminAuditRepository } from './repositories/admin-audit.repository';

type AdminAccessPayload = {
  sub: string;
  professionalEmail: string;
  exp: number;
};

type AdminAccessStep = 'setup_code_sent' | 'personal_code_required';

@Injectable()
export class AdminTotpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly auditRepository: AdminAuditRepository,
  ) {}

  isRequired(): boolean {
    return process.env.ADMIN_CODE_REQUIRED?.trim().toLowerCase() !== 'false';
  }

  async startCodeFlow(user: AuthenticatedUser, professionalEmail: string, ipAddress?: string): Promise<{ status: AdminAccessStep; expiresAt?: string }> {
    const access = await this.findOrCreateAccess(user, professionalEmail);
    const now = new Date();

    if (access.personalCodeHash && access.personalCodeExpiresAt && access.personalCodeExpiresAt > now) {
      await this.auditRepository.record(user.id, 'admin.access.code.personal.required', 'adminAccess', access.id, { ipAddress });
      return { status: 'personal_code_required', expiresAt: access.personalCodeExpiresAt.toISOString() };
    }

    const setupCode = String(randomInt(100000, 1000000));
    const setupCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.adminAccess.update({
      where: { id: access.id },
      data: {
        setupCodeHash: hashSecret(setupCode),
        setupCodeExpiresAt,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.emailNotificationService.sendAdminSetupCode({ to: access.professionalEmail, code: setupCode });
    await this.auditRepository.record(user.id, 'admin.access.code.setup.sent', 'adminAccess', access.id, { ipAddress });
    return { status: 'setup_code_sent', expiresAt: setupCodeExpiresAt.toISOString() };
  }

  async setupPersonalCode(
    user: AuthenticatedUser,
    professionalEmail: string,
    setupCode: string,
    personalCode: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; expiresAt: string; personalCodeExpiresAt: string }> {
    this.assertPersonalCodePolicy(personalCode);
    const access = await this.findActiveAccess(user, professionalEmail);
    const now = new Date();

    if (!access.setupCodeHash || !access.setupCodeExpiresAt || access.setupCodeExpiresAt <= now || !verifySecret(setupCode, access.setupCodeHash)) {
      await this.auditRepository.record(user.id, 'admin.access.code.setup.failed', 'adminAccess', access.id, { ipAddress });
      throw new UnauthorizedException('Invalid admin setup code.');
    }

    const personalCodeExpiresAt = addMonths(now, 6);
    await this.prisma.adminAccess.update({
      where: { id: access.id },
      data: {
        personalCodeHash: hashSecret(personalCode),
        personalCodeExpiresAt,
        setupCodeHash: null,
        setupCodeExpiresAt: null,
        failedAttempts: 0,
        lockedUntil: null,
        lastVerifiedAt: now,
      },
    });

    await this.auditRepository.record(user.id, 'admin.access.code.setup.completed', 'adminAccess', access.id, { ipAddress });
    return { ...this.issueAccessToken(user, access.professionalEmail), personalCodeExpiresAt: personalCodeExpiresAt.toISOString() };
  }

  async verifyPersonalCode(
    user: AuthenticatedUser,
    professionalEmail: string,
    personalCode: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; expiresAt: string; personalCodeExpiresAt: string }> {
    const access = await this.findActiveAccess(user, professionalEmail);
    const now = new Date();

    if (access.lockedUntil && access.lockedUntil > now) {
      throw new ForbiddenException('Admin access is temporarily locked.');
    }

    if (!access.personalCodeHash || !access.personalCodeExpiresAt || access.personalCodeExpiresAt <= now) {
      throw new ForbiddenException('Admin personal code must be renewed.');
    }

    if (!verifySecret(personalCode, access.personalCodeHash)) {
      const failedAttempts = access.failedAttempts + 1;
      await this.prisma.adminAccess.update({
        where: { id: access.id },
        data: {
          failedAttempts,
          lastFailedAt: now,
          lockedUntil: failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      await this.auditRepository.record(user.id, 'admin.access.code.verify.failed', 'adminAccess', access.id, {
        ipAddress,
        metadata: { failedAttempts },
      });
      throw new UnauthorizedException('Invalid admin personal code.');
    }

    await this.prisma.adminAccess.update({
      where: { id: access.id },
      data: { failedAttempts: 0, lockedUntil: null, lastVerifiedAt: now },
    });

    await this.auditRepository.record(user.id, 'admin.access.code.verify.succeeded', 'adminAccess', access.id, { ipAddress });
    return { ...this.issueAccessToken(user, access.professionalEmail), personalCodeExpiresAt: access.personalCodeExpiresAt.toISOString() };
  }

  async resetPersonalCode(admin: AuthenticatedUser, accessId: string, ipAddress?: string) {
    const access = await this.prisma.adminAccess.findUnique({ where: { id: accessId } });
    if (!access) {
      throw new ForbiddenException('Admin access is not available.');
    }
    if (access.userId === admin.id) {
      throw new ForbiddenException('You cannot reset your own admin code from this panel.');
    }

    const setupCode = String(randomInt(100000, 1000000));
    const setupCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const updated = await this.prisma.adminAccess.update({
      where: { id: access.id },
      data: {
        personalCodeHash: null,
        personalCodeExpiresAt: null,
        setupCodeHash: hashSecret(setupCode),
        setupCodeExpiresAt,
        failedAttempts: 0,
        lockedUntil: null,
        lastFailedAt: null,
      },
    });

    await this.emailNotificationService.sendAdminSetupCode({ to: updated.professionalEmail, code: setupCode });
    await this.auditRepository.record(admin.id, 'admin.access.code.reset', 'adminAccess', updated.id, { ipAddress });
    return { ok: true, expiresAt: setupCodeExpiresAt.toISOString() };
  }

  verifyAccessToken(user: AuthenticatedUser, token: string | undefined): void {
    if (!this.isRequired()) return;
    if (!token) {
      throw new ForbiddenException('Admin verification is required.');
    }

    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature || !this.constantTimeEqual(signature, this.signature(encodedPayload))) {
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

  private async findOrCreateAccess(user: AuthenticatedUser, professionalEmail: string) {
    this.assertSignedInAdmin(user);
    const normalizedProfessionalEmail = normalizeEmail(professionalEmail);

    const existingAccess = await this.prisma.adminAccess.findUnique({
      where: { userId_professionalEmail: { userId: user.id, professionalEmail: normalizedProfessionalEmail } },
    });
    if (existingAccess) {
      if (!existingAccess.isActive) {
        throw new ForbiddenException('Admin access is disabled.');
      }
      return existingAccess;
    }

    const allowedProfessionalEmail = this.bootstrapProfessionalEmailForConnectedAccount(user.email);
    if (normalizedProfessionalEmail !== allowedProfessionalEmail) {
      throw new ForbiddenException('Admin professional email is not authorized for this account.');
    }
    return this.prisma.adminAccess.upsert({
      where: { userId_professionalEmail: { userId: user.id, professionalEmail: normalizedProfessionalEmail } },
      create: { userId: user.id, professionalEmail: normalizedProfessionalEmail },
      update: {},
    });
  }

  private async findActiveAccess(user: AuthenticatedUser, professionalEmail: string) {
    const access = await this.findOrCreateAccess(user, professionalEmail);
    if (access.lockedUntil && access.lockedUntil > new Date()) {
      throw new ForbiddenException('Admin access is temporarily locked.');
    }
    return access;
  }

  private assertSignedInAdmin(user: AuthenticatedUser): void {
    if (!user.roles.includes(UserRole.Admin)) {
      throw new ForbiddenException('Admin role is required.');
    }
  }

  private bootstrapProfessionalEmailForConnectedAccount(connectedEmail: string): string {
    const normalizedConnectedEmail = normalizeEmail(connectedEmail);
    const configured = (process.env.ADMIN_PRO_EMAIL_MAP ?? 'kendostyve94@gmail.com:contact.kendronics@gmail.com')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [accountEmail, ...professionalParts] = entry.split(':');
        return [normalizeEmail(accountEmail), normalizeEmail(professionalParts.join(':'))] as const;
      });

    const match = configured.find(([accountEmail]) => accountEmail === normalizedConnectedEmail);
    if (!match?.[1]) {
      throw new ForbiddenException('No admin professional email is linked to this account.');
    }
    return match[1];
  }

  private assertPersonalCodePolicy(personalCode: string): void {
    if (!/^[A-Za-z0-9!@#$%^&*._-]{6,32}$/.test(personalCode)) {
      throw new ForbiddenException('Admin personal code does not match policy.');
    }
  }

  private issueAccessToken(user: AuthenticatedUser, professionalEmail: string): { accessToken: string; expiresAt: string } {
    const ttlSeconds = Number(process.env.ADMIN_CODE_SESSION_TTL_SECONDS ?? 900);
    const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds);
    const payload: AdminAccessPayload = { sub: user.id, professionalEmail, exp };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return {
      accessToken: `${encodedPayload}.${this.signature(encodedPayload)}`,
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }

  private signature(value: string): string {
    return createHmac('sha256', `${process.env.JWT_SECRET ?? 'development-only-change-me'}:admin-code`).update(value).digest('base64url');
  }

  private constantTimeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashSecret(secret: string): string {
  const salt = randomBytes(16).toString('base64url');
  const iterations = 120000;
  const digest = pbkdf2Sync(secret, salt, iterations, 32, 'sha256').toString('base64url');
  return `pbkdf2_sha256$${iterations}$${salt}$${digest}`;
}

function verifySecret(secret: string, storedHash: string): boolean {
  const [algorithm, iterationsRaw, salt, digest] = storedHash.split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationsRaw || !salt || !digest) return false;
  const expected = Buffer.from(digest);
  const actual = Buffer.from(pbkdf2Sync(secret, salt, Number(iterationsRaw), 32, 'sha256').toString('base64url'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
