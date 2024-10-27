import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@src/module/billing/core/model/subscription.model';
import { SubscriptionService } from '@src/module/billing/core/service/subscription.service';
import { BillingSubsriptionStatusApi } from '@src/shared/module/integration/interface/billing-integration.interface';

@Injectable()
export class BillingPublicApiProvider implements BillingSubsriptionStatusApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionService.getSubscriptionByUserId(userId);
    return subscription?.status === SubscriptionStatus.Active ? true : false;
  }
}
