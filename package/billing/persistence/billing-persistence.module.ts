import { Module } from '@nestjs/common';
import { BillingConfig } from '@tlc/billing/config';
import { PlanRepository } from '@tlc/billing/persistence/repository/plan.repository';
import { SubscriptionRepository } from '@tlc/billing/persistence/repository/subscription.repository';
import { dataSourceOptionsFactory } from '@tlc/billing/persistence/typeorm-datasource.factory';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm/typeorm-persistence.module';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'billing',
      inject: [ConfigService],
      useFactory: (configService: ConfigService<BillingConfig>) => {
        return dataSourceOptionsFactory(configService);
      },
    }),
  ],
  providers: [PlanRepository, SubscriptionRepository],
  exports: [PlanRepository, SubscriptionRepository],
})
export class BillingPersistenceModule {}
