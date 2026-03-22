import { BadRequestException, Injectable } from '@nestjs/common';
import { Subscription } from '../../persistence/entity/subscription.entity';
import { SubscriptionStatus } from '../enum/subscription-status.enum';

@Injectable()
export class SubscriptionStateMachineService {
  private readonly ALLOWED_TRANSITIONS: Map<SubscriptionStatus, SubscriptionStatus[]> = new Map([
    [SubscriptionStatus.Trialing, [SubscriptionStatus.Active, SubscriptionStatus.PastDue, SubscriptionStatus.Expired, SubscriptionStatus.Cancelled]],
    [SubscriptionStatus.Active, [SubscriptionStatus.PastDue, SubscriptionStatus.Cancelled, SubscriptionStatus.Expired]],
    [SubscriptionStatus.PastDue, [SubscriptionStatus.Active, SubscriptionStatus.Suspended, SubscriptionStatus.Cancelled]],
    [SubscriptionStatus.Suspended, [SubscriptionStatus.Active, SubscriptionStatus.Cancelled]],
    [SubscriptionStatus.Cancelled, []],
    [SubscriptionStatus.Expired, []],
    [SubscriptionStatus.Inactive, [SubscriptionStatus.Active]],
  ]);

  private readonly BILLING_OPERATION_ALLOWED_STATUSES = [
    SubscriptionStatus.Active,
    SubscriptionStatus.Trialing,
  ];

  private readonly USAGE_RECORD_ALLOWED_STATUSES = [
    SubscriptionStatus.Active,
    SubscriptionStatus.Trialing,
    SubscriptionStatus.PastDue,
  ];

  private readonly ACCESS_GRANTED_STATUSES = [
    SubscriptionStatus.Active,
    SubscriptionStatus.Trialing,
    SubscriptionStatus.PastDue,
  ];

  transition(subscription: Subscription, newStatus: SubscriptionStatus): void {
    const allowed = this.ALLOWED_TRANSITIONS.get(subscription.status) ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid subscription status transition from "${subscription.status}" to "${newStatus}"`
      );
    }
    subscription.status = newStatus;
  }

  assertCanPerformBillingOperation(subscription: Subscription, operationName: string): void {
    if (!this.BILLING_OPERATION_ALLOWED_STATUSES.includes(subscription.status)) {
      throw new BadRequestException(
        `Cannot perform "${operationName}" on a subscription with status "${subscription.status}"`
      );
    }
  }

  assertCanRecordUsage(subscription: Subscription): void {
    if (!this.USAGE_RECORD_ALLOWED_STATUSES.includes(subscription.status)) {
      throw new BadRequestException(
        `Cannot record usage on a subscription with status "${subscription.status}"`
      );
    }
  }

  isAccessGranted(subscription: Subscription): boolean {
    return this.ACCESS_GRANTED_STATUSES.includes(subscription.status);
  }
}
