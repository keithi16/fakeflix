import { Module } from '@nestjs/common';
import { billingApiFactory } from '@tlc/app/billing-api/config';
import { billingConfigFactory, BillingModule } from '@tlc/billing/billing.module';
import { ConfigModule } from '@tlc/shared-module/config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [billingConfigFactory, billingApiFactory],
    }),
    BillingModule,
  ],
})
export class BillingApiModule {}
