import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { AnalyticsBingeSession } from '../entity/analytics-binge-session.entity';

@Injectable()
export class BingeSessionRepository extends DefaultTypeOrmRepository<AnalyticsBingeSession> {
  constructor(@InjectDataSource('analytics') dataSource: DataSource) {
    super(AnalyticsBingeSession, dataSource.manager);
  }

  async findActiveSessionForUser(
    userId: string,
    seriesContentId: string
  ): Promise<AnalyticsBingeSession | null> {
    return this.findOne({ where: { userId, seriesContentId, endedAt: IsNull() } });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.transactionalEntityManager
      .getRepository(AnalyticsBingeSession)
      .count({ where: { userId } });
  }

  async countAll(): Promise<number> {
    return this.transactionalEntityManager.getRepository(AnalyticsBingeSession).count();
  }
}
