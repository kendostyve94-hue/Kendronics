import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { PasswordService } from '../auth/password.service';
import { UploadRepository } from '../uploads/repositories/upload.repository';
import { AccountDeletionFeedbackDto } from './dto/account-deletion-feedback.dto';
import { UpdateAccountAddressDto, UpdateAccountProfileDto } from './dto/update-account-settings.dto';
import { UpsertCookieConsentDto } from './dto/cookie-consent.dto';
import { CookieConsent } from './entities/cookie-consent.entity';
import { User } from './entities/user.entity';
import { AccountDeletionFeedbackRepository } from './repositories/account-deletion-feedback.repository';
import { CookieConsentRepository } from './repositories/cookie-consent.repository';
import { UsersRepository } from './repositories/users.repository';
import { UserRole } from '../../common/types/user-role.enum';

const currentCookieConsentVersion = '2026-05-07';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cookieConsentRepository: CookieConsentRepository,
    private readonly accountDeletionFeedbackRepository: AccountDeletionFeedbackRepository,
    private readonly passwordService: PasswordService,
    private readonly uploadRepository: UploadRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createUser(dto: RegisterDto): Promise<User> {
    const realEmail = dto.email?.trim().toLowerCase();
    const phone = normalizePhone(dto.phone);
    if (!realEmail && !phone) {
      throw new BadRequestException('An email or phone number is required.');
    }
    if (realEmail) {
      const existingUser = await this.usersRepository.findByEmail(realEmail);
      if (existingUser) {
        throw new ConflictException('An account already exists for this email.');
      }
    }
    if (phone) {
      const existingPhone = await this.usersRepository.findByPhone(phone);
      if (existingPhone) {
        throw new ConflictException('An account already exists for this phone number.');
      }
    }

    const email = realEmail ?? internalPhoneEmail(phone ?? randomUUID());
    const profile = dto.profile;
    const accountType = profile?.accountType === 'company' ? 'business' : 'individual';
    return this.usersRepository.create({
      email,
      fullName: dto.fullName,
      phone,
      country: cleanString(profile?.country),
      accountType,
      cguAcceptedAt: new Date(),
      profileDetails: sanitizeProfileDetails({
        accountType: profile?.accountType,
        customerType: profile?.accountType,
        firstName: dto.fullName.trim().split(/\s+/)[0] ?? '',
        lastName: dto.fullName.trim().split(/\s+/).slice(1).join(' '),
      }),
      passwordHash: await this.passwordService.hash(dto.password),
      roles: this.rolesForEmail(email),
    });
  }

  async findOrCreateOAuthUser(input: { email: string; fullName?: string }): Promise<User> {
    const email = input.email.toLowerCase();
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      return existingUser;
    }

    return this.usersRepository.create({
      email,
      fullName: input.fullName?.trim() || email,
      passwordHash: await this.passwordService.hash(randomUUID()),
      roles: this.rolesForEmail(email),
      emailVerifiedAt: new Date(),
    });
  }

  async validateCredentials(contact: string, password: string): Promise<User | null> {
    const normalized = contact.trim().toLowerCase();
    const user = normalized.includes('@')
      ? await this.usersRepository.findByEmail(normalized)
      : await this.usersRepository.findByPhone(contact.trim());
    if (!user) {
      return null;
    }

    const validPassword = await this.passwordService.verify(password, user.passwordHash);
    return validPassword ? user : null;
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email.toLowerCase());
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findByPhone(phone.trim());
  }

  listAdmins(): Promise<User[]> {
    return this.usersRepository.findByRole(UserRole.Admin);
  }

  async grantAdminRole(email: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.roles.includes(UserRole.Admin)) {
      return user;
    }

    return this.usersRepository.updateRoles(user.id, uniqueRoles([...user.roles, UserRole.Admin]));
  }

  async revokeAdminRole(userId: string): Promise<User> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.usersRepository.updateRoles(
      user.id,
      user.roles.filter((role) => role !== UserRole.Admin),
    );
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    await this.usersRepository.updatePasswordHash(userId, await this.passwordService.hash(password));
  }

  async updateProfile(userId: string, dto: UpdateAccountProfileDto): Promise<User> {
    const current = await this.usersRepository.findById(userId);
    if (!current) {
      throw new NotFoundException('User not found.');
    }

    const nextEmail = dto.email?.trim().toLowerCase();
    const nextPhone = dto.phone === undefined ? current.phone ?? null : normalizePhone(dto.phone) ?? null;
    if (nextEmail && nextEmail !== current.email) {
      const existing = await this.usersRepository.findByEmail(nextEmail);
      if (existing && existing.id !== userId) {
        throw new ConflictException('An account already exists for this email.');
      }
    }

    return this.usersRepository.updateProfile(userId, {
      fullName: cleanString(dto.fullName) ?? current.fullName,
      email: nextEmail ?? current.email,
      phone: nextPhone,
      companyName: cleanString(dto.companyName) ?? null,
      country: cleanString(dto.country) ?? null,
      avatarDataUrl: validAvatarDataUrl(dto.avatarDataUrl) ? dto.avatarDataUrl : current.avatarDataUrl ?? null,
      profileDetails: sanitizeProfileDetails(dto.profileDetails),
      emailVerifiedAt: nextEmail && nextEmail !== current.email ? null : current.emailVerifiedAt ?? null,
      phoneVerifiedAt: nextPhone !== (current.phone ?? null) ? null : current.phoneVerifiedAt ?? null,
    });
  }

  updateAddress(userId: string, kind: 'shippingAddress' | 'billingAddress', dto: UpdateAccountAddressDto): Promise<User> {
    return this.usersRepository.updateAddress(userId, kind, sanitizeAddress(dto.address));
  }

  async deleteAccount(userId: string): Promise<void> {
    const storageKeys = await this.usersRepository.findGerberStorageKeysByUserId(userId);
    await this.usersRepository.deleteById(userId);
    await this.uploadRepository.deleteStorageKeys(storageKeys);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.usersRepository.markEmailVerified(userId);
  }

  async startPhoneVerification(userId: string, phone: string): Promise<{ ok: true; provider: string }> {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) throw new BadRequestException('Phone number is required.');
    const provider = process.env.PHONE_VERIFY_PROVIDER ?? (process.env.NODE_ENV === 'production' ? 'twilio' : 'dev');

    let providerVerificationSid: string | undefined;
    let codeHash: string | undefined;
    let code: string | undefined;

    if (provider === 'twilio') {
      const verification = await twilioVerifyRequest('Verifications', {
        To: normalizedPhone,
        Channel: twilioVerifyChannel(),
      });
      providerVerificationSid = stringValue(verification.sid);
    } else if (provider === 'dev') {
      code = String(Math.floor(100000 + Math.random() * 900000));
      codeHash = hashCode(code);
      providerVerificationSid = `dev_${randomUUID()}`;
    } else {
      throw new ServiceUnavailableException('Phone verification provider is not configured.');
    }

    await this.prisma.phoneVerification.create({
      data: {
        userId,
        phone: normalizedPhone,
        provider,
        providerVerificationSid,
        codeHash,
        status: 'pending',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    if (provider === 'dev' && code) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'verification.phone.code',
          title: 'Code de verification telephone',
          body: `Code ${code}. Il expire dans 10 minutes.`,
        },
      });
    }

    return { ok: true, provider };
  }

  async checkPhoneVerification(userId: string, phone: string, code: string): Promise<{ ok: true }> {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !code.trim()) throw new BadRequestException('Phone number and code are required.');

    const record = await this.prisma.phoneVerification.findFirst({
      where: { userId, phone: normalizedPhone, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || (record.expiresAt && record.expiresAt.getTime() < Date.now())) {
      throw new BadRequestException('Phone verification expired or missing.');
    }
    if (record.attempts >= 5) {
      throw new BadRequestException('Phone verification attempts exceeded.');
    }

    const approved = record.provider === 'twilio'
      ? await verifyTwilioPhoneCode(normalizedPhone, code.trim())
      : record.codeHash === hashCode(code.trim());
    if (!approved) {
      await this.prisma.phoneVerification.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException('Invalid verification code.');
    }

    await this.prisma.$transaction([
      this.prisma.phoneVerification.update({ where: { id: record.id }, data: { status: 'verified', verifiedAt: new Date() } }),
      this.prisma.user.update({ where: { id: userId }, data: { phone: normalizedPhone, phoneVerifiedAt: new Date() } }),
      this.prisma.userAuditLog.create({ data: { userId, actorId: userId, eventType: 'phone.verified' } }),
    ]);
    return { ok: true };
  }

  async createAccountDeletionFeedback(user: { id: string; email: string }, dto: AccountDeletionFeedbackDto): Promise<{ ok: true }> {
    return this.accountDeletionFeedbackRepository.create(user, dto);
  }

  findCookieConsent(userId: string): Promise<CookieConsent | null> {
    return this.cookieConsentRepository.findLatestByUserId(userId);
  }

  upsertCookieConsent(userId: string, dto: UpsertCookieConsentDto): Promise<CookieConsent> {
    void this.usersRepository.updateProfile(userId, { cguAcceptedAt: new Date() }).catch(() => undefined);
    return this.cookieConsentRepository.upsert({
      userId,
      version: dto.version?.trim() || currentCookieConsentVersion,
      analytics: dto.analytics,
      preferences: dto.preferences,
    });
  }

  private rolesForEmail(email: string): UserRole[] {
    const adminEmails = (process.env.ADMIN_EMAILS ?? 'kendostyve94@gmail.com')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    return adminEmails.includes(email) ? [UserRole.User, UserRole.Admin] : [UserRole.User];
  }
}

function cleanString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizePhone(value: string | undefined): string | undefined {
  const trimmed = cleanString(value);
  if (!trimmed) return undefined;
  const parsed = parsePhoneNumberFromString(trimmed);
  if (!parsed?.isValid()) {
    throw new BadRequestException('A valid international phone number is required.');
  }
  return parsed.number;
}

function sanitizeAddress(address: Record<string, unknown>): Record<string, string> {
  const allowedKeys = [
    'accountType',
    'firstName',
    'lastName',
    'company',
    'street',
    'apartment',
    'country',
    'region',
    'city',
    'postalCode',
    'taxId',
    'phone',
  ];

  return Object.fromEntries(
    allowedKeys.map((key) => [key, typeof address[key] === 'string' ? String(address[key]).trim().slice(0, 180) : '']),
  );
}

function sanitizeProfileDetails(details: Record<string, unknown> | undefined): Record<string, string | string[]> {
  const source = details ?? {};
  const stringKeys = [
    'accountType',
    'customerType',
    'industry',
    'hearAboutUs',
    'firstName',
    'lastName',
    'gender',
    'website',
    'birthday',
  ];
  const listKeys = ['orderPreference', 'productInterests'];
  const output: Record<string, string | string[]> = {};

  for (const key of stringKeys) {
    output[key] = typeof source[key] === 'string' ? String(source[key]).trim().slice(0, 180) : '';
  }

  for (const key of listKeys) {
    output[key] = Array.isArray(source[key])
      ? (source[key] as unknown[]).filter((item): item is string => typeof item === 'string').map((item) => item.trim().slice(0, 80)).filter(Boolean).slice(0, 20)
      : [];
  }

  return output;
}

function validAvatarDataUrl(value: string | undefined): boolean {
  if (!value) return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value) && value.length <= 3000000;
}

function uniqueRoles(roles: UserRole[]): UserRole[] {
  return Array.from(new Set(roles));
}

function hashCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

function internalPhoneEmail(phone: string): string {
  return `phone-${createHash('sha256').update(phone).digest('hex').slice(0, 24)}@kendronics.local`;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function twilioVerifyChannel(): string {
  const allowedChannels = new Set(['sms', 'call', 'email', 'whatsapp']);
  const configuredChannels = (process.env.TWILIO_VERIFY_CHANNEL ?? 'sms')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return configuredChannels.find((channel) => allowedChannels.has(channel)) ?? 'sms';
}

async function verifyTwilioPhoneCode(phone: string, code: string): Promise<boolean> {
  const result = await twilioVerifyRequest('VerificationCheck', { To: phone, Code: code });
  return result.status === 'approved';
}

async function twilioVerifyRequest(action: 'Verifications' | 'VerificationCheck', body: Record<string, string>): Promise<Record<string, unknown>> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) {
    throw new ServiceUnavailableException('Twilio Verify is not configured.');
  }

  const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/${action}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ServiceUnavailableException(typeof payload?.message === 'string' ? payload.message : 'Twilio Verify request failed.');
  }

  return objectValue(payload);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
