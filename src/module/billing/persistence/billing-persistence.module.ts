import { DynamicModule } from '@nestjs/common';
import { Plan } from '@src/module/billing/persistence/entity/plan.entity';
import { Subscription } from '@src/module/billing/persistence/entity/subscription.entity';
import { PlanRepository } from '@src/module/billing/persistence/repository/plan.repository';
import { SubscriptionRepository } from '@src/module/billing/persistence/repository/subscription.repository';
import { TypeOrmPersistenceModule } from '@src/shared/module/persistence/typeorm/typeorm-persistence.module';

export class BillingPersistenceModule {
  static forRoot(opts?: { migrations?: string[] }): DynamicModule {
    const { migrations } = opts || {};
    return {
      module: BillingPersistenceModule,
      imports: [
        TypeOrmPersistenceModule.forRoot({
          connectionName: 'billing',
          migrations,
          entities: [Plan, Subscription],
        }),
      ],
      providers: [PlanRepository, SubscriptionRepository],
      exports: [PlanRepository, SubscriptionRepository],
    };
  }
}
