import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Plan } from '../entity/plan.entity';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm/repository/default-typeorm.repository';
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
