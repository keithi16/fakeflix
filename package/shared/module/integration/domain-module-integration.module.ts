import { Module } from '@nestjs/common';
import { HttpClientModule } from '@tlc/shared-module/http-client/http-client.module';
import { BillingSubscriptionHttpClient } from '@tlc/shared-module/integration/http/client/billing-subscription-http.client';

@Module({
  imports: [HttpClientModule],
  providers: [BillingSubscriptionHttpClient],
  exports: [BillingSubscriptionHttpClient],
})
export class DomainModuleIntegrationModule {}
