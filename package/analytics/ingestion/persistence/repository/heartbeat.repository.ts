import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { AnalyticsHeartbeat } from '../entity/analytics-heartbeat.entity';

@Injectable()
export class HeartbeatRepository extends DefaultTypeOrmRepository<AnalyticsHeartbeat> {
  constructor(@InjectDataSource('analytics') dataSource: DataSource) {
    super(AnalyticsHeartbeat, dataSource.manager);
  }

  async bulkInsert(heartbeats: Partial<AnalyticsHeartbeat>[]): Promise<void> {
    const entities = heartbeats.map((h) => new AnalyticsHeartbeat(h));
    await this.transactionalEntityManager.save(AnalyticsHeartbeat, entities);
  }
}
