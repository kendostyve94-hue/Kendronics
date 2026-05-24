import { UserRole } from '../../../common/types/user-role.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  country?: string;
  avatarDataUrl?: string;
  profileDetails?: Record<string, unknown>;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  roles: UserRole[];
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
