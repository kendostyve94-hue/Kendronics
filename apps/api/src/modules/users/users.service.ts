import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegisterDto } from '../auth/dto/register.dto';
import { PasswordService } from '../auth/password.service';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';
import { UserRole } from '../../common/types/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
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

  private rolesForEmail(email: string): UserRole[] {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    return adminEmails.includes(email) ? [UserRole.User, UserRole.Admin] : [UserRole.User];
  }
}
