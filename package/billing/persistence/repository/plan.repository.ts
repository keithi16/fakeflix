import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { Plan } from '../entity/plan.entity';

@Injectable()
export class PlanRepository extends DefaultTypeOrmRepository<Plan> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(Plan, dataSource.manager);
  }
}
