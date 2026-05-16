import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegisterDto } from '../auth/dto/register.dto';
import { PasswordService } from '../auth/password.service';
import { UpsertCookieConsentDto } from './dto/cookie-consent.dto';
import { CookieConsent } from './entities/cookie-consent.entity';
import { User } from './entities/user.entity';
import { CookieConsentRepository } from './repositories/cookie-consent.repository';
import { UsersRepository } from './repositories/users.repository';
import { UserRole } from '../../common/types/user-role.enum';

const currentCookieConsentVersion = '2026-05-07';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cookieConsentRepository: CookieConsentRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async createUser(dto: RegisterDto): Promise<User> {
    const email = dto.email.toLowerCase();
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

  async deleteAccount(userId: string): Promise<void> {
    await this.usersRepository.deleteById(userId);
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
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    return adminEmails.includes(email) ? [UserRole.User, UserRole.Admin] : [UserRole.User];
  }
}

function uniqueRoles(roles: UserRole[]): UserRole[] {
  return Array.from(new Set(roles));
}
