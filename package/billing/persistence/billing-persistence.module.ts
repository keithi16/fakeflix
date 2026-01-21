import { Module } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { BillingConfig } from '../config';
import { PlanRepository } from './repository/plan.repository';
import { SubscriptionRepository } from './repository/subscription.repository';
import { InvoiceRepository } from './repository/invoice.repository';
import { InvoiceLineItemRepository } from './repository/invoice-line-item.repository';
import { ChargeRepository } from './repository/charge.repository';
import { CreditRepository } from './repository/credit.repository';
import { AddOnRepository } from './repository/add-on.repository';
import { SubscriptionAddOnRepository } from './repository/subscription-add-on.repository';
import { UsageRecordRepository } from './repository/usage-record.repository';
import { TaxRateRepository } from './repository/tax-rate.repository';
import { DiscountRepository } from './repository/discount.repository';
import { SubscriptionDiscountRepository } from './repository/subscription-discount.repository';
import { PaymentRepository } from './repository/payment.repository';
import { DunningAttemptRepository } from './repository/dunning-attempt.repository';
import { TaxCalculationSummaryRepository } from './repository/tax-calculation-summary.repository';
import { TaxCalculationErrorRepository } from './repository/tax-calculation-error.repository';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

const repositories = [
  PlanRepository,
  SubscriptionRepository,
  InvoiceRepository,
  InvoiceLineItemRepository,
  ChargeRepository,
  CreditRepository,
  AddOnRepository,
  SubscriptionAddOnRepository,
  UsageRecordRepository,
  TaxRateRepository,
  DiscountRepository,
  SubscriptionDiscountRepository,
  PaymentRepository,
  DunningAttemptRepository,
  TaxCalculationSummaryRepository,
  TaxCalculationErrorRepository,
];

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'billing',
      inject: [ConfigService],
      useFactory: (configService: ConfigService<BillingConfig>) => {
        return dataSourceOptionsFactory(configService);
      },
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource({
          name: options.name,
          dataSource: new DataSource(options),
        });
      },
    }),
  ],
  providers: [...repositories],
  exports: [...repositories],
})
export class BillingPersistenceModule {}
