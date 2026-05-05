import { Injectable } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { User } from '../../persistence/entity/user.entity';
import { UserRepository } from '../../persistence/repository/user.repository';
import { hash } from 'bcrypt';
import { IdentityConfig } from '../../config';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UserManagementService {
  private readonly saltRounds: number;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService<IdentityConfig>
  ) {
    this.saltRounds = this.configService.get('identity.security.passwordHashSaltRounds');
  }

  async create(user: CreateUserDto) {
    const newUser = new User({
      ...user,
      password: await hash(user.password, this.saltRounds),
    });

    await this.userRepository.save(newUser);
    return newUser;
  }

  async getUserById(id: string) {
    return this.userRepository.findOneById(id);
  }
}
