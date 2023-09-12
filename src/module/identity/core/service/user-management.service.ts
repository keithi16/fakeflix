import { Injectable } from '@nestjs/common';
import {
  UserEntity,
  UserEntityProps,
} from '@src/module/identity/core/entity/user.entity';
import { UserRepository } from '@src/module/identity/persistence/repository/user.repository';

export type CreateUserDto = UserEntityProps;
@Injectable()
export class UserManagementService {
  constructor(private readonly userRepository: UserRepository) {}
  async create(user: CreateUserDto) {
    const createdUser = await this.userRepository.save(await UserEntity.create(user));
    return createdUser;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({ id });
    return user;
  }
}
