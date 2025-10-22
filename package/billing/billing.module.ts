import { Module } from '@nestjs/common';
import { AuthModule } from '@tlc/shared-module/auth';
import { ClsModule } from 'nestjs-cls';
import { SubscriptionService } from './core/service/subscription.service';
import { SubscriptionBillingService } from './core/service/subscription-billing.service';
import { ProrationCalculatorService } from './core/service/proration-calculator.service';
import { UsageBillingService } from './core/service/usage-billing.service';
import { TaxCalculatorService } from './core/service/tax-calculator.service';
import { DiscountEngineService } from './core/service/discount-engine.service';
import { InvoiceGeneratorService } from './core/service/invoice-generator.service';
import { InvoiceService } from './core/service/invoice.service';
import { CreditManagerService } from './core/service/credit-manager.service';
import { AddOnManagerService } from './core/service/add-on-manager.service';
import { DunningManagerService } from './core/service/dunning-manager.service';
import { SubscriptionController } from './http/rest/controller/subscription.controller';
import { SubscriptionBillingController } from './http/rest/controller/subscription-billing.controller';
import { InvoiceController } from './http/rest/controller/invoice.controller';
import { UsageController } from './http/rest/controller/usage.controller';
import { CreditController } from './http/rest/controller/credit.controller';
import { BillingPublicApiProvider } from './integration/provider/public-api.provider';
import { EasyTaxProvider } from './integration/provider/easytax-tax.provider';
import { PaymentGatewayProvider } from './integration/provider/payment-gateway.provider';
import { AccountingIntegrationProvider } from './integration/provider/accounting-integration.provider';
import { BillingPersistenceModule } from './persistence/billing-persistence.module';
import { LoggerModule } from '@tlc/shared-module/logger';

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

const integrationProviders = [
  BillingPublicApiProvider,
  EasyTaxProvider,
  PaymentGatewayProvider,
  AccountingIntegrationProvider,
];

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
  providers: [...coreServices, ...integrationProviders],
  controllers: [
    SubscriptionController,
    SubscriptionBillingController,
    InvoiceController,
    UsageController,
    CreditController,
  ],
  exports: [BillingPublicApiProvider, ...coreServices],
})
export class BillingModule {}

export { factory as billingConfigFactory } from './config';
