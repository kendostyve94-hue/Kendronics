export interface Session {
  id: string;
  userId: string;
  email: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
}
