import { Module } from '@nestjs/common';
import { billingConfigFactory, BillingModule } from '@tlc/billing';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { billingApiFactory } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [billingConfigFactory, billingApiFactory],
    }),
    BillingModule,
  ],
})
export class BillingApiModule {}
