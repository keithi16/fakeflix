import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource, IsNull, MoreThan, Or } from 'typeorm';
import { SubscriptionDiscount } from '../entity/subscription-discount.entity';

@Injectable()
export class SubscriptionDiscountRepository extends DefaultTypeOrmRepository<SubscriptionDiscount> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(SubscriptionDiscount, dataSource.manager);
  }

  async findById(id: string): Promise<SubscriptionDiscount | null> {
    return this.findOne({
      where: { id },
      relations: ['subscription', 'discount'],
    });
  }

  async findActiveBySubscriptionId(subscriptionId: string): Promise<SubscriptionDiscount[]> {
    const currentDate = new Date();
    
    return this.find({
      where: {
        subscriptionId,
        expiresAt: Or(MoreThan(currentDate), IsNull()),
      },
      relations: ['discount'],
      order: { appliedAt: 'DESC' },
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<SubscriptionDiscount[]> {
    return this.find({
      where: { subscriptionId },
      relations: ['discount'],
      order: { appliedAt: 'DESC' },
    });
  }
}

