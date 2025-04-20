import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@tlc/billing/core/enum/subscription-status.enum';
import { Subscription } from '@tlc/billing/persistence/entity/subscription.entity';

import { PlanRepository } from '@tlc/billing/persistence/repository/plan.repository';
import { SubscriptionRepository } from '@tlc/billing/persistence/repository/subscription.repository';
import { NotFoundDomainException } from '@tlc/shared-lib/core/exeption/not-found-domain.exception';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly clsService: ClsService
  ) {}

  async createSubscription({ planId }: { planId: string }): Promise<Subscription> {
    const plan = await this.planRepository.findOneById(planId);
    if (!plan) {
      throw new NotFoundDomainException(`Plan with id ${planId} not found`);
    }
    const subscription = new Subscription({
      plan,
      userId: this.clsService.get('userId'),
      status: SubscriptionStatus.Active,
      startDate: new Date(),
      autoRenew: true,
    });
    await this.subscriptionRepository.save(subscription);
    return subscription;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOneByUserId(userId);
  }

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOneByUserId(userId);
    return subscription?.status === SubscriptionStatus.Active;
  }
}
