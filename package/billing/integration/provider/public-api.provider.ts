import { Injectable } from '@nestjs/common';
import { BillingSubscriptionStatusApi } from '@tlc/shared-module/integration';
import { SubscriptionService } from '../../core/service/subscription.service';

@Injectable()
export class BillingPublicApiProvider implements BillingSubscriptionStatusApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return await this.subscriptionService.isUserSubscriptionActive(userId);
  }
}
