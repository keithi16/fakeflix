import { Injectable } from '@nestjs/common';
import { UserEntity } from '@src/module/identity/core/entity/user.entity';
import { UserRepository } from '@src/module/identity/persistence/repository/user.repository';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
@Injectable()
export class UserManagementService {
  constructor(private readonly userRepository: UserRepository) {}
  async create(user: CreateUserDto) {
    const newUser = await UserEntity.createNew(user);
    await this.userRepository.save(newUser);
    return newUser;
  }

  async getUserById(id: string) {
    return this.userRepository.findOneBy({ id });
  }
}
