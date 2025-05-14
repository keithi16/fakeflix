import { Module } from '@nestjs/common';
import { AuthModule } from '@tlc/shared-module/auth';
import { ClsModule } from 'nestjs-cls';
import { SubscriptionService } from './core/service/subscription.service';
import { SubscriptionController } from './http/rest/controller/subscription.controller';
import { BillingPublicApiProvider } from './integration/provider/public-api.provider';
import { BillingPersistenceModule } from './persistence/billing-persistence.module';
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
