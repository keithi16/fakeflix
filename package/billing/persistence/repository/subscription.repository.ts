import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource, In, LessThanOrEqual } from 'typeorm';
import { SubscriptionStatus } from '../../core/enum/subscription-status.enum';
import { Subscription } from '../entity/subscription.entity';

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

  async findActiveByUserIdWithDetails(userId: string): Promise<Subscription | null> {
    return this.findOne({
      where: { userId, status: SubscriptionStatus.Active },
      relations: ['plan', 'addOns', 'addOns.addOn', 'discounts', 'discounts.discount'],
    });
  }

  async findActiveByIdAndUserIdWithDetails(
    subscriptionId: string,
    userId: string
  ): Promise<Subscription | null> {
    return this.findOne({
      where: {
        id: subscriptionId,
        userId,
        status: In([SubscriptionStatus.Active, SubscriptionStatus.Trialing]),
      },
      relations: ['plan', 'addOns', 'addOns.addOn', 'discounts', 'discounts.discount'],
    });
  }

  async findByIdWithPlanAndAddOns(subscriptionId: string): Promise<Subscription | null> {
    return this.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'addOns'],
    });
  }

  async findByIdWithFullDetails(subscriptionId: string): Promise<Subscription | null> {
    return this.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'addOns', 'addOns.addOn', 'discounts', 'discounts.discount'],
    });
  }

  async findByIdWithPlan(subscriptionId: string): Promise<Subscription | null> {
    return this.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });
  }

  async findExpiredTrials(asOf: Date = new Date()): Promise<Subscription[]> {
    return this.find({
      where: {
        status: SubscriptionStatus.Trialing,
        trialEndsAt: LessThanOrEqual(asOf),
      },
    });
  }
}
