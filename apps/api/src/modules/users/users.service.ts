import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  ) {}

  async createUser(dto: RegisterDto): Promise<User> {
    const email = dto.email.toLowerCase();
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('An account already exists for this email.');
    }

    return this.usersRepository.create({
      email,
      fullName: dto.fullName,
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

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email.toLowerCase());
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
    if (nextEmail && nextEmail !== current.email) {
      const existing = await this.usersRepository.findByEmail(nextEmail);
      if (existing && existing.id !== userId) {
        throw new ConflictException('An account already exists for this email.');
      }
    }

    return this.usersRepository.updateProfile(userId, {
      fullName: cleanString(dto.fullName) ?? current.fullName,
      email: nextEmail ?? current.email,
      phone: cleanString(dto.phone) ?? null,
      companyName: cleanString(dto.companyName) ?? null,
      country: cleanString(dto.country) ?? null,
      avatarDataUrl: validAvatarDataUrl(dto.avatarDataUrl) ? dto.avatarDataUrl : current.avatarDataUrl ?? null,
      profileDetails: sanitizeProfileDetails(dto.profileDetails),
      emailVerifiedAt: nextEmail && nextEmail !== current.email ? null : current.emailVerifiedAt ?? null,
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

  async createAccountDeletionFeedback(user: { id: string; email: string }, dto: AccountDeletionFeedbackDto): Promise<{ ok: true }> {
    return this.accountDeletionFeedbackRepository.create(user, dto);
  }

  findCookieConsent(userId: string): Promise<CookieConsent | null> {
    return this.cookieConsentRepository.findLatestByUserId(userId);
  }

  upsertCookieConsent(userId: string, dto: UpsertCookieConsentDto): Promise<CookieConsent> {
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
