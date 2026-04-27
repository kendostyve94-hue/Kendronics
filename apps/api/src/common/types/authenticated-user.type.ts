import { UserRole } from './user-role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: UserRole[];
}
