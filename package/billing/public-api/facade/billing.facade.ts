import { Injectable } from '@nestjs/common';
import { BillingSubscriptionStatusApi } from '@tlc/shared-module/public-api';
import { SubscriptionService } from '../../subscription/core/service/subscription.service';

@Injectable()
export class BillingFacade implements BillingSubscriptionStatusApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return await this.subscriptionService.isUserSubscriptionActive(userId);
  }
}

