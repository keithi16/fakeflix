import { Module } from '@nestjs/common';
import { HttpClientModule } from '../http-client/http-client.module';
import { BillingSubscriptionHttpClient } from './http/client/billing-subscription-http.client';

@Module({
  imports: [HttpClientModule],
  providers: [BillingSubscriptionHttpClient],
  exports: [BillingSubscriptionHttpClient],
})
export class DomainModuleIntegrationModule {}
