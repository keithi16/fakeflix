import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Subscription } from '@src/module/billing/persistence/entity/subscription.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class SubscriptionRepository extends DefaultTypeOrmRepository<Subscription> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(Subscription, dataSource.manager);
  }

  async findOneByUserId(userId: string): Promise<Subscription | null> {
    return this.findOne({
      where: {
        userId,
      },
    });
  }
}
