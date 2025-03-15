import { Module } from '@nestjs/common';
import { BillingModule } from '@tlc/billing/billing.module';

@Module({
  imports: [BillingModule],
})
export class BillingApiModule {}
