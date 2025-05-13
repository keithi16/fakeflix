import { Injectable } from '@nestjs/common';
import { SubscriptionService } from '../../core/service/subscription.service';
import { BillingSubscriptionStatusApi } from '@tlc/shared-module/integration/interface/billing-integration.interface';

@Injectable()
export class BillingPublicApiProvider implements BillingSubscriptionStatusApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return await this.subscriptionService.isUserSubscriptionActive(userId);
  }
}
