import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        phone: input.phone,
        country: input.country,
        profileDetails: input.profileDetails as Prisma.InputJsonValue | undefined,
        accountType: input.accountType ?? 'individual',
        verificationLevel: input.verificationLevel ?? 0,
        verificationStatus: input.verificationStatus ?? 'unverified',
        riskScore: input.riskScore ?? 0,
        mfaEnabled: input.mfaEnabled ?? false,
        cguAcceptedAt: input.cguAcceptedAt,
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

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({ where: { phone } });
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
      phoneVerifiedAt?: Date | null;
      companyName?: string | null;
      country?: string | null;
      avatarDataUrl?: string | null;
      profileDetails?: Prisma.InputJsonValue;
      emailVerifiedAt?: Date | null;
      accountType?: string;
      verificationLevel?: number;
      verificationStatus?: string;
      riskScore?: number;
      mfaEnabled?: boolean;
      cguAcceptedAt?: Date | null;
    },
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: input,
    });
    return this.toUser(user);
  }

  async updateAddress(userId: string, kind: 'shippingAddress' | 'billingAddress', address: Prisma.InputJsonValue): Promise<User> {
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
      await tx.emailVerification.deleteMany({ where: { userId } });
      await tx.phoneVerification.deleteMany({ where: { userId } });
      await tx.identityVerification.deleteMany({ where: { userId } });
      await tx.businessVerification.deleteMany({ where: { userId } });
      await tx.verificationDocument.deleteMany({ where: { userId } });
      await tx.mfaFactor.deleteMany({ where: { userId } });
      await tx.riskEvent.deleteMany({ where: { userId } });
      await tx.notificationPreference.deleteMany({ where: { userId } });
      await tx.pushSubscription.deleteMany({ where: { userId } });
      await tx.userAuditLog.deleteMany({ where: { OR: [{ userId }, { actorId: userId }] } });
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
    phoneVerifiedAt: Date | null;
    country: string | null;
    avatarDataUrl: string | null;
    profileDetails: unknown;
    shippingAddress: unknown;
    billingAddress: unknown;
    accountType: string;
    verificationLevel: number;
    verificationStatus: string;
    riskScore: number;
    mfaEnabled: boolean;
    cguAcceptedAt: Date | null;
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
      phoneVerifiedAt: user.phoneVerifiedAt ?? undefined,
      country: user.country ?? undefined,
      avatarDataUrl: user.avatarDataUrl ?? undefined,
      profileDetails: objectValue(user.profileDetails),
      shippingAddress: objectValue(user.shippingAddress),
      billingAddress: objectValue(user.billingAddress),
      accountType: user.accountType === 'business' ? 'business' : 'individual',
      verificationLevel: user.verificationLevel,
      verificationStatus: user.verificationStatus,
      riskScore: user.riskScore,
      mfaEnabled: user.mfaEnabled,
      cguAcceptedAt: user.cguAcceptedAt ?? undefined,
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
