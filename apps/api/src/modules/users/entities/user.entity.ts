import { UserRole } from '../../../common/types/user-role.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  phoneVerifiedAt?: Date;
  country?: string;
  avatarDataUrl?: string;
  profileDetails?: Record<string, unknown>;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  accountType?: 'individual' | 'business';
  verificationLevel?: number;
  verificationStatus?: string;
  riskScore?: number;
  mfaEnabled?: boolean;
  cguAcceptedAt?: Date;
  roles: UserRole[];
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
