import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole } from '../../../common/types/user-role.enum';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: Omit<User, 'id' | 'roles' | 'createdAt'> & { roles?: UserRole[] }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        companyName: input.companyName,
        roles: input.roles ?? [UserRole.User],
        emailVerifiedAt: input.emailVerifiedAt,
      },
    });
    return this.toUser(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toUser(user) : null;
  }

  private toUser(user: {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    companyName: string | null;
    roles: string[];
    emailVerifiedAt: Date | null;
    createdAt: Date;
  }): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      companyName: user.companyName ?? undefined,
      roles: user.roles as UserRole[],
      emailVerifiedAt: user.emailVerifiedAt ?? undefined,
      createdAt: user.createdAt,
    };
  }
}
