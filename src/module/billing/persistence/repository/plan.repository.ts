import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Plan } from '@src/module/billing/persistence/entity/plan.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class PlanRepository extends DefaultTypeOrmRepository<Plan> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(Plan, dataSource.manager);
  }
}
