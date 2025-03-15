import { Module } from '@nestjs/common';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { HttpClientModule } from '@tlc/shared-module/http-client/http-client.module';
import { BillingSubscriptionHttpClient } from '@tlc/shared-module/integration/http/client/billing-subscription-http.client';

@Module({
  imports: [ConfigModule.forRoot(), HttpClientModule],
  providers: [BillingSubscriptionHttpClient],
  exports: [BillingSubscriptionHttpClient],
})
export class DomainModuleIntegrationModule {}
