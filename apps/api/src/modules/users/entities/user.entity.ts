import { UserRole } from '../../../common/types/user-role.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  companyName?: string;
  roles: UserRole[];
  emailVerifiedAt?: Date;
  createdAt: Date;
}
