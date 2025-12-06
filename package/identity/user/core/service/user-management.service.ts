import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { CreateUserDto } from '../interface/create-user.interface';
import { User } from '../../persistence/entity/user.entity';
import { UserRepository } from '../../persistence/repository/user.repository';

//TODO move to a configuration
export const PASSWORD_HASH_SALT = 10;

@Injectable()
export class UserManagementService {
  constructor(private readonly userRepository: UserRepository) {}
  async create(user: CreateUserDto) {
    const newUser = new User({
      ...user,
      password: await hash(user.password, PASSWORD_HASH_SALT),
    });

    await this.userRepository.save(newUser);
    return newUser;
  }

  async getUserById(id: string) {
    return this.userRepository.findOneById(id);
  }
}
