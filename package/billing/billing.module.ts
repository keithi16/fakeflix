import { Module } from '@nestjs/common';
import { SubscriptionService } from '@tlc/billing/core/service/subscription.service';
import { SubscriptionController } from '@tlc/billing/http/rest/controller/subscription.controller';
import { BillingPublicApiProvider } from '@tlc/billing/integration/provider/public-api.provider';
import { BillingPersistenceModule } from '@tlc/billing/persistence/billing-persistence.module';
import { AuthModule } from '@tlc/shared-module/auth/auth.module';
import { ClsModule } from 'nestjs-cls';
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    BillingPersistenceModule,
    AuthModule,
  ],
  providers: [SubscriptionService, BillingPublicApiProvider],
  controllers: [SubscriptionController],
  exports: [BillingPublicApiProvider],
})
export class BillingModule {}

export { factory as billingConfigFactory } from './config';
