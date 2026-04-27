import { Injectable } from '@nestjs/common';
import { UserRole } from '../../../common/types/user-role.enum';
import { demoTrackingUser } from '../../tracking/demo-tracking-data';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly users = new Map<string, User>();

  constructor() {
    this.users.set(demoTrackingUser.id, demoTrackingUser);
  }

  async create(input: Omit<User, 'id' | 'roles' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...input,
      id: crypto.randomUUID(),
      roles: [UserRole.User],
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmailAndPassword(email: string, password: string): Promise<User | null> {
    return (
      [...this.users.values()].find(
        (user) => user.email === email && user.passwordHash === `hash:${password}`,
      ) ?? null
    );
  }
}
