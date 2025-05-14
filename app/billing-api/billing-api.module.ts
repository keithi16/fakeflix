import { Module } from '@nestjs/common';
import { billingConfigFactory, BillingModule } from '@tlc/billing';
import { ConfigModule } from '@tlc/shared-module/config';
import { billingApiFactory } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [billingConfigFactory, billingApiFactory],
    }),
    BillingModule,
  ],
})
//test tag
export class BillingApiModule {}
