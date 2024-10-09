import { Inject, Injectable } from '@nestjs/common';
import { PlanModel } from '@src/module/billing/core/model/plan.model';
import * as schema from '@src/module/billing/persistence/database.schema';
import { plansTable } from '@src/module/billing/persistence/database.schema';
import { DrizzleDefaultRepository } from '@src/shared/module/persistence/drizzle/repository/drizzle-default.repository';
import { InferSelectModel } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

@Injectable()
export class PlanRepository extends DrizzleDefaultRepository<
  PlanModel,
  typeof plansTable
> {
  constructor(
    @Inject('DB_POSTGRES')
    protected readonly db: PostgresJsDatabase<typeof schema>
  ) {
    super(db, plansTable);
  }

  protected mapToModel(data: InferSelectModel<typeof plansTable>): PlanModel {
    return PlanModel.createFrom(data);
  }
}
