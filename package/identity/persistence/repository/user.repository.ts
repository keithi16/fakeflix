import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../entity/user.entity';

@Injectable()
export class UserRepository extends DefaultTypeOrmRepository<User> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource
  ) {
    super(User, dataSource.manager);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: {
        email,
      },
    });
  }
}
