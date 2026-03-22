import { BadRequestException, Injectable } from '@nestjs/common';
import { addDays } from 'date-fns';
import { Transactional } from 'typeorm-transactional';
import { Subscription } from '../../persistence/entity/subscription.entity';
import { SubscriptionStatus } from '../enum/subscription-status.enum';

import { NotFoundDomainException } from '@tlc/shared-lib/common';
import { ClsService } from 'nestjs-cls';
import { PlanRepository } from '../../persistence/repository/plan.repository';
import { SubscriptionRepository } from '../../persistence/repository/subscription.repository';
import { SubscriptionStateMachineService } from './subscription-state-machine.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly clsService: ClsService,
    private readonly subscriptionStateMachine: SubscriptionStateMachineService
  ) {}

  @Transactional({ connectionName: 'billing' })
  async createSubscription({ planId }: { planId: string }): Promise<Subscription> {
    const plan = await this.planRepository.findOneById(planId);
    if (!plan) {
      throw new NotFoundDomainException(`Plan with id ${planId} not found`);
    }

    const now = new Date();
    const hasTrial = plan.trialPeriod > 0;

    const subscription = new Subscription({
      plan,
      userId: this.clsService.get('userId'),
      status: hasTrial ? SubscriptionStatus.Trialing : SubscriptionStatus.Active,
      startDate: now,
      autoRenew: true,
      trialEndsAt: hasTrial ? addDays(now, plan.trialPeriod) : null,
    });
    await this.subscriptionRepository.save(subscription);
    return subscription;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOneByUserId(userId);
  }

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOneByUserId(userId);
    if (!subscription) return false;
    return this.subscriptionStateMachine.isAccessGranted(subscription);
  }

  @Transactional({ connectionName: 'billing' })
  async processTrialExpiry(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundDomainException(`Subscription with id ${subscriptionId} not found`);
    }

    if (subscription.status !== SubscriptionStatus.Trialing) {
      throw new BadRequestException(
        `Cannot process trial expiry for subscription with status "${subscription.status}"`
      );
    }

    const now = new Date();
    if (!subscription.trialEndsAt || subscription.trialEndsAt > now) {
      throw new BadRequestException('Trial period has not ended yet');
    }

    this.subscriptionStateMachine.transition(subscription, SubscriptionStatus.Expired);
    await this.subscriptionRepository.save(subscription);
    return subscription;
  }

  @Transactional({ connectionName: 'billing' })
  async cancelSubscription(subscriptionId: string, userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundDomainException(`Subscription with id ${subscriptionId} not found`);
    }

    const now = new Date();
    this.subscriptionStateMachine.transition(subscription, SubscriptionStatus.Cancelled);
    subscription.canceledAt = now;
    subscription.endDate = now;
    await this.subscriptionRepository.save(subscription);
    return subscription;
  }

  @Transactional({ connectionName: 'billing' })
  async scheduleCancel(subscriptionId: string, userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundDomainException(`Subscription with id ${subscriptionId} not found`);
    }

    const nonCancellableStatuses = [
      SubscriptionStatus.Cancelled,
      SubscriptionStatus.Suspended,
      SubscriptionStatus.Expired,
    ];
    if (nonCancellableStatuses.includes(subscription.status)) {
      throw new BadRequestException(
        `Cannot schedule cancellation for subscription with status "${subscription.status}"`
      );
    }

    subscription.cancelAtPeriodEnd = true;
    await this.subscriptionRepository.save(subscription);
    return subscription;
  }

  @Transactional({ connectionName: 'billing' })
  async reactivateSubscription(subscriptionId: string, userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundDomainException(`Subscription with id ${subscriptionId} not found`);
    }

    if (subscription.status !== SubscriptionStatus.Suspended) {
      throw new BadRequestException(
        `Cannot reactivate subscription with status "${subscription.status}"`
      );
    }

    this.subscriptionStateMachine.transition(subscription, SubscriptionStatus.Active);
    await this.subscriptionRepository.save(subscription);
    return subscription;
  }
}
