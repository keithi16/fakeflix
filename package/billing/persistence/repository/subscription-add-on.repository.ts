import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { SubscriptionAddOn } from '../entity/subscription-add-on.entity';

@Injectable()
export class SubscriptionAddOnRepository extends DefaultTypeOrmRepository<SubscriptionAddOn> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(SubscriptionAddOn, dataSource.manager);
  }

  async findById(id: string): Promise<SubscriptionAddOn | null> {
    return this.findOne({
      where: { id },
      relations: ['subscription', 'addOn'],
    });
  }

  async findActiveBySubscriptionId(subscriptionId: string): Promise<SubscriptionAddOn[]> {
    return this.find({
      where: {
        subscriptionId,
        endDate: IsNull(),
      },
      relations: ['addOn'],
      order: { startDate: 'DESC' },
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<SubscriptionAddOn[]> {
    return this.find({
      where: { subscriptionId },
      relations: ['addOn'],
      order: { startDate: 'DESC' },
    });
  }
}

