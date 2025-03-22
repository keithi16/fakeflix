import { Module } from '@nestjs/common';
import { SubscriptionService } from '@tlc/billing/core/service/subscription.service';
import { SubscriptionController } from '@tlc/billing/http/rest/controller/subscription.controller';
import { BillingPublicApiProvider } from '@tlc/billing/integration/provider/public-api.provider';
import { BillingPersistenceModule } from '@tlc/billing/persistence/billing-persistence.module';

@Module({
  imports: [BillingPersistenceModule],
  providers: [SubscriptionService, BillingPublicApiProvider],
  controllers: [SubscriptionController],
  exports: [BillingPublicApiProvider],
})
export class BillingModule {}

export { factory as billingConfigFactory } from './config';
