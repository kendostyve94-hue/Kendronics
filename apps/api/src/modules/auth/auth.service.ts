import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailNotificationService } from '../support/email-notification.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthTokens } from './entities/auth-tokens.entity';
import { ProfileVerificationService } from './profile-verification.service';
import { SessionRepository } from './repositories/session.repository';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionRepository: SessionRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly prisma: PrismaService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly profileVerificationService: ProfileVerificationService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const user = await this.usersService.createUser(dto);
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: 'account.complete_profile',
        title: 'Completez votre compte',
        body: 'Ajoutez votre telephone, vos informations de profil et votre adresse de livraison pour pouvoir soumettre une commande.',
      },
    });
    if (isRealEmail(user.email) && (dto.contactMethod ?? 'email') === 'email') {
      await this.profileVerificationService.requestCode({ userId: user.id, email: user.email, action: 'account' });
    } else if (user.phone) {
      await this.usersService.startPhoneVerification(user.id, user.phone);
    }
    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const contact = dto.contact ?? dto.email ?? '';
    const user = await this.usersService.validateCredentials(contact, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user.id, user.email);
  }

  async loginWithOAuth(input: { email: string; fullName?: string }): Promise<AuthTokens> {
    const user = await this.usersService.findOrCreateOAuthUser(input);
    return this.issueTokens(user.id, user.email);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: true; message: string }> {
    const email = dto.email.toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const token = randomBytes(32).toString('base64url');
      const resetRecord = await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashResetToken(token),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      try {
        await this.emailNotificationService.sendPasswordResetLink({
          to: user.email,
          resetUrl: this.passwordResetUrl(token),
        });
      } catch (error) {
        await this.prisma.passwordResetToken.deleteMany({ where: { id: resetRecord.id } });
        console.error('Password reset email failed:', error instanceof Error ? error.message : String(error));
      }
    }

    return {
      ok: true,
      message: 'If an account can receive password reset email, we will send instructions shortly.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: true }> {
    const tokenHash = this.hashResetToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Password reset link is invalid or expired.');
    }

    await this.usersService.updatePassword(resetToken.userId, dto.password);
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
    await this.sessionRepository.revokeAllForUser(resetToken.userId);
    return { ok: true };
  }

  async requestEmailChange(userId: string, newEmail: string): Promise<{ ok: true }> {
    const normalizedEmail = newEmail.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing && existing.id !== userId) {
      throw new ConflictException('An account already exists for this email.');
    }

    await this.profileVerificationService.requestCode({
      userId,
      email: normalizedEmail,
      action: 'email_change',
      metadata: { newEmail: normalizedEmail },
    });
    await this.prisma.userAuditLog.create({ data: { userId, actorId: userId, eventType: 'email_change.requested', metadataJson: { newEmail: normalizedEmail } } });
    return { ok: true };
  }

  async confirmEmailChange(userId: string, newEmail: string, code: string): Promise<{ ok: true }> {
    const normalizedEmail = newEmail.trim().toLowerCase();
    const verification = await this.profileVerificationService.verifyCode({ userId, action: 'email_change', code });
    if (verification.metadata?.newEmail !== normalizedEmail) {
      throw new BadRequestException('Verification code does not match this email.');
    }

    const previous = await this.usersService.findById(userId);
    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing && existing.id !== userId) {
      throw new ConflictException('An account already exists for this email.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail, emailVerifiedAt: new Date() },
    });
    await this.sessionRepository.revokeAllForUser(userId);
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'security.email_changed',
        title: 'E-mail modifie',
        body: 'Votre adresse e-mail Kendronics a ete modifiee et verifiee.',
      },
    });
    await this.prisma.userAuditLog.create({ data: { userId, actorId: userId, eventType: 'email_change.confirmed', metadataJson: { newEmail: normalizedEmail } } });
    if (previous?.email && isRealEmail(previous.email)) {
      void this.emailNotificationService.sendSecurityNotice({
        to: previous.email,
        subject: 'Adresse e-mail modifiee',
        lines: [
          'Votre adresse e-mail Kendronics vient d etre modifiee.',
          `Nouvelle adresse: ${normalizedEmail}`,
          '',
          'Si vous n etes pas a l origine de cette action, contactez immediatement le support Kendronics.',
        ],
      }).catch(() => undefined);
    }
    return { ok: true };
  }

  async requestPasswordChange(userId: string): Promise<{ ok: true }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found.');
    if (!isRealEmail(user.email)) {
      throw new BadRequestException('A verified email is required before changing the password from this screen.');
    }
    await this.profileVerificationService.requestCode({ userId, email: user.email, action: 'password_change' });
    await this.prisma.userAuditLog.create({ data: { userId, actorId: userId, eventType: 'password_change.requested' } });
    return { ok: true };
  }

  async confirmPasswordChange(userId: string, newPassword: string, code: string): Promise<{ ok: true }> {
    await this.profileVerificationService.verifyCode({ userId, action: 'password_change', code });
    await this.usersService.updatePassword(userId, newPassword);
    await this.sessionRepository.revokeAllForUser(userId);
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'security.password_changed',
        title: 'Mot de passe modifie',
        body: 'Votre mot de passe Kendronics a ete modifie. Les autres sessions ont ete deconnectees.',
      },
    });
    await this.prisma.userAuditLog.create({ data: { userId, actorId: userId, eventType: 'password_change.confirmed' } });
    const user = await this.usersService.findById(userId);
    if (user?.email && isRealEmail(user.email)) {
      void this.emailNotificationService.sendSecurityNotice({
        to: user.email,
        subject: 'Mot de passe modifie',
        lines: [
          'Votre mot de passe Kendronics vient d etre modifie.',
          'Les autres sessions ouvertes ont ete deconnectees.',
          '',
          'Si vous n etes pas a l origine de cette action, contactez immediatement le support Kendronics.',
        ],
      }).catch(() => undefined);
    }
    return { ok: true };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    const session = await this.sessionRepository.findValidSession(dto.refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    await this.sessionRepository.revoke(session.id);
    return this.issueTokens(session.userId, session.email);
  }

  async logout(dto: RefreshTokenDto): Promise<{ ok: true }> {
    if (dto.refreshToken) {
      await this.sessionRepository.revokeByRefreshToken(dto.refreshToken);
    }
    return { ok: true };
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const accessToken = this.authTokenService.createAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });
    const refreshToken = this.authTokenService.createRefreshToken();
    await this.sessionRepository.create({ userId, email, refreshToken });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private passwordResetUrl(token: string): string {
    const frontendOrigin = process.env.FRONTEND_ORIGIN?.split(',')[0] ?? 'http://localhost:3000';
    const url = new URL('/reset-password', frontendOrigin);
    url.searchParams.set('token', token);
    return url.toString();
  }
}

function isRealEmail(email: string): boolean {
  return !email.endsWith('@kendronics.local');
}
