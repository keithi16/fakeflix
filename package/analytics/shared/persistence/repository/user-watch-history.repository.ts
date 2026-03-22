import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource, FindOptionsOrder } from 'typeorm';
import { AnalyticsUserWatchHistory } from '../entity/analytics-user-watch-history.entity';

@Injectable()
export class UserWatchHistoryRepository extends DefaultTypeOrmRepository<AnalyticsUserWatchHistory> {
  constructor(@InjectDataSource('analytics') dataSource: DataSource) {
    super(AnalyticsUserWatchHistory, dataSource.manager);
  }

  async findByUserAndContent(
    userId: string,
    contentId: string
  ): Promise<AnalyticsUserWatchHistory | null> {
    return this.findOne({ where: { userId, contentId } });
  }

  async findByUser(
    userId: string,
    options?: { limit?: number; completedOnly?: boolean }
  ): Promise<AnalyticsUserWatchHistory[]> {
    const order: FindOptionsOrder<AnalyticsUserWatchHistory> = { lastWatchedAt: 'DESC' };
    return this.transactionalEntityManager.getRepository(AnalyticsUserWatchHistory).find({
      where: {
        userId,
        ...(options?.completedOnly ? { completed: true } : {}),
      },
      order,
      take: options?.limit,
    });
  }

  async findActiveSince(since: Date): Promise<AnalyticsUserWatchHistory[]> {
    return this.transactionalEntityManager
      .getRepository(AnalyticsUserWatchHistory)
      .createQueryBuilder('h')
      .where('h.lastWatchedAt >= :since', { since })
      .getMany();
  }

  async upsertByUserAndContent(
    userId: string,
    contentId: string,
    updates: Partial<AnalyticsUserWatchHistory>
  ): Promise<AnalyticsUserWatchHistory> {
    let entry = await this.findByUserAndContent(userId, contentId);
    if (!entry) {
      entry = new AnalyticsUserWatchHistory({ userId, contentId, ...updates });
    } else {
      Object.assign(entry, updates);
    }
    return this.save(entry);
  }
}
