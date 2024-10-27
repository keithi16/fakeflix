import { Module } from '@nestjs/common';
import { SubscriptionService } from '@src/module/billing/core/service/subscription.service';
import { SubscriptionController } from '@src/module/billing/http/rest/controller/subscription.controller';
import { BillingPublicApiProvider } from '@src/module/billing/integration/provider/public-api.provider';
import { BillingPersistenceModule } from '@src/module/billing/persistence/billing-persistence.module';

@Module({
  imports: [BillingPersistenceModule],
  providers: [SubscriptionService, BillingPublicApiProvider],
  controllers: [SubscriptionController],
  exports: [BillingPublicApiProvider],
})
export class BillingModule {}
