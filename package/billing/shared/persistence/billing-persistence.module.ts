import { Module } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { BillingConfig } from '../../config';
import { PlanRepository } from '../../subscription/persistence/repository/plan.repository';
import { SubscriptionRepository } from '../../subscription/persistence/repository/subscription.repository';
import { InvoiceRepository } from '../../invoice/persistence/repository/invoice.repository';
import { InvoiceLineItemRepository } from '../../invoice/persistence/repository/invoice-line-item.repository';
import { ChargeRepository } from '../../invoice/persistence/repository/charge.repository';
import { CreditRepository } from '../../credit/persistence/repository/credit.repository';
import { AddOnRepository } from '../../subscription/persistence/repository/add-on.repository';
import { SubscriptionAddOnRepository } from '../../subscription/persistence/repository/subscription-add-on.repository';
import { UsageRecordRepository } from '../../usage/persistence/repository/usage-record.repository';
import { TaxRateRepository } from '../../tax/persistence/repository/tax-rate.repository';
import { DiscountRepository } from '../../subscription/persistence/repository/discount.repository';
import { SubscriptionDiscountRepository } from '../../subscription/persistence/repository/subscription-discount.repository';
import { PaymentRepository } from '../../payment/persistence/repository/payment.repository';
import { DunningAttemptRepository } from '../../payment/persistence/repository/dunning-attempt.repository';
import { TaxCalculationSummaryRepository } from '../../tax/persistence/repository/tax-calculation-summary.repository';
import { TaxCalculationErrorRepository } from '../../tax/persistence/repository/tax-calculation-error.repository';
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
