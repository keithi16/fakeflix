import { Module } from '@nestjs/common';
import { PlanRepository } from '@src/module/billing/persistence/repository/plan.repository';
import { SubscriptionRepository } from '@src/module/billing/persistence/repository/subscription.repository';
import * as billingSchema from '@src/module/billing/persistence/schema';
import { DrizzlePersistenceModule } from '@src/shared/module/persistence/drizzle/drizzle-persistence.module';

@Module({
  imports: [DrizzlePersistenceModule.forRoot(billingSchema)],
  providers: [PlanRepository, SubscriptionRepository],
  exports: [PlanRepository, SubscriptionRepository],
})
export class BillingPersistenceModule {}
