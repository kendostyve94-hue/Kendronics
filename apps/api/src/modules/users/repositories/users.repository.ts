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

  async findByRole(role: UserRole): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { roles: { has: role } },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((user) => this.toUser(user));
  }

  async updateRoles(userId: string, roles: UserRole[]): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { roles },
    });
    return this.toUser(user);
  }

  async updateProfile(
    userId: string,
    input: {
      fullName?: string;
      email?: string;
      phone?: string | null;
      companyName?: string | null;
      country?: string | null;
      emailVerifiedAt?: Date | null;
    },
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: input,
    });
    return this.toUser(user);
  }

  async updateAddress(userId: string, kind: 'shippingAddress' | 'billingAddress', address: Record<string, unknown>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { [kind]: address },
    });
    return this.toUser(user);
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async findGerberStorageKeysByUserId(userId: string): Promise<string[]> {
    const uploads = await this.prisma.gerberUpload.findMany({
      where: { userId },
      select: { storageKey: true },
    });
    return uploads.map((upload) => upload.storageKey).filter(Boolean);
  }

  async deleteById(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
      await tx.profileVerificationCode.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.cookieConsent.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.adminAccess.deleteMany({ where: { userId } });
      await tx.adminAuditLog.deleteMany({ where: { actorUserId: userId } });
      await tx.trackingEvent.deleteMany({ where: { order: { userId } } });
      await tx.paymentEvent.updateMany({ where: { payment: { userId } }, data: { paymentId: null } });
      await tx.payment.deleteMany({ where: { userId } });
      await tx.order.deleteMany({ where: { userId } });
      await tx.quote.deleteMany({ where: { userId } });
      await tx.gerberUpload.deleteMany({ where: { userId } });
      await tx.supportTicket.updateMany({
        where: {
          OR: [
            { userId },
            ...(user?.email ? [{ requesterEmail: user.email.toLowerCase() }] : []),
          ],
        },
        data: {
          userId: null,
          requesterName: null,
          requesterEmail: null,
          message: '[account deleted]',
          attachmentName: null,
        },
      });
      await tx.user.delete({ where: { id: userId } });
    });
  }

  private toUser(user: {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    companyName: string | null;
    phone: string | null;
    country: string | null;
    shippingAddress: unknown;
    billingAddress: unknown;
    roles: string[];
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt?: Date;
  }): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      companyName: user.companyName ?? undefined,
      phone: user.phone ?? undefined,
      country: user.country ?? undefined,
      shippingAddress: objectValue(user.shippingAddress),
      billingAddress: objectValue(user.billingAddress),
      roles: user.roles as UserRole[],
      emailVerifiedAt: user.emailVerifiedAt ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}
