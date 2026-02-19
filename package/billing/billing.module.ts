import { Module } from '@nestjs/common';
import { AuthModule } from '@tlc/shared-module/auth';
import { LoggerModule } from '@tlc/shared-module/logger';
import { ClsModule } from 'nestjs-cls';
import { AddOnManagerService } from './core/service/add-on-manager.service';
import { CreditManagerService } from './core/service/credit-manager.service';
import { DiscountEngineService } from './core/service/discount-engine.service';
import { DunningManagerService } from './core/service/dunning-manager.service';
import { InvoiceGeneratorService } from './core/service/invoice-generator.service';
import { InvoiceService } from './core/service/invoice.service';
import { ProrationCalculatorService } from './core/service/proration-calculator.service';
import { SubscriptionBillingService } from './core/service/subscription-billing.service';
import { SubscriptionService } from './core/service/subscription.service';
import { TaxCalculatorService } from './core/service/tax-calculator.service';
import { UsageBillingService } from './core/service/usage-billing.service';
import { AccountingIntegrationClient } from './http/client/accounting-api/accounting-integration.client';
import { EasyTaxClient } from './http/client/easytax-api/easytax-tax.client';
import { PaymentGatewayClient } from './http/client/payment-gateway-api/payment-gateway.client';
import { CreditController } from './http/rest/controller/credit.controller';
import { InvoiceController } from './http/rest/controller/invoice.controller';
import { SubscriptionBillingController } from './http/rest/controller/subscription-billing.controller';
import { SubscriptionController } from './http/rest/controller/subscription.controller';
import { UsageController } from './http/rest/controller/usage.controller';
import { BillingPersistenceModule } from './persistence/billing-persistence.module';
import { BillingFacade } from './public-api/facade/billing.facade';

const coreServices = [
  SubscriptionService,
  SubscriptionBillingService,
  ProrationCalculatorService,
  UsageBillingService,
  TaxCalculatorService,
  DiscountEngineService,
  InvoiceGeneratorService,
  InvoiceService,
  CreditManagerService,
  AddOnManagerService,
  DunningManagerService,
];

const httpClients = [EasyTaxClient, PaymentGatewayClient, AccountingIntegrationClient];

const publicApiFacades = [BillingFacade];

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    BillingPersistenceModule,
    AuthModule,
    LoggerModule,
  ],
  providers: [...coreServices, ...httpClients, ...publicApiFacades],
  controllers: [
    SubscriptionController,
    SubscriptionBillingController,
    InvoiceController,
    UsageController,
    CreditController,
  ],
  exports: [BillingFacade],
})
export class BillingModule {}

export { factory as billingConfigFactory } from './config';
