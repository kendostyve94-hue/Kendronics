import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  createUser(dto: RegisterDto): Promise<User> {
    return this.usersRepository.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      companyName: dto.companyName,
      passwordHash: `hash:${dto.password}`,
    });
  }

  validateCredentials(email: string, password: string): Promise<User | null> {
    return this.usersRepository.findByEmailAndPassword(email.toLowerCase(), password);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
