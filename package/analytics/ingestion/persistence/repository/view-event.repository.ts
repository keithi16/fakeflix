import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { AnalyticsViewEvent } from '../entity/analytics-view-event.entity';

@Injectable()
export class ViewEventRepository extends DefaultTypeOrmRepository<AnalyticsViewEvent> {
  constructor(@InjectDataSource('analytics') dataSource: DataSource) {
    super(AnalyticsViewEvent, dataSource.manager);
  }

  async bulkInsert(events: Partial<AnalyticsViewEvent>[]): Promise<void> {
    const entities = events.map((e) => new AnalyticsViewEvent(e));
    await this.transactionalEntityManager.save(AnalyticsViewEvent, entities);
  }

  async findBySessionId(sessionId: string): Promise<AnalyticsViewEvent[]> {
    return this.find({ where: { sessionId } });
  }

  async findByUserAndContentInWindow(
    userId: string,
    contentId: string,
    from: Date,
    to: Date
  ): Promise<AnalyticsViewEvent[]> {
    return this.transactionalEntityManager
      .getRepository(AnalyticsViewEvent)
      .createQueryBuilder('e')
      .where('e.userId = :userId', { userId })
      .andWhere('e.contentId = :contentId', { contentId })
      .andWhere('e.occurredAt BETWEEN :from AND :to', { from, to })
      .orderBy('e.occurredAt', 'ASC')
      .getMany();
  }

  async findInWindow(from: Date, to: Date): Promise<AnalyticsViewEvent[]> {
    return this.transactionalEntityManager
      .getRepository(AnalyticsViewEvent)
      .createQueryBuilder('e')
      .where('e.occurredAt BETWEEN :from AND :to', { from, to })
      .getMany();
  }

  async findWithGenresSince(since: Date): Promise<AnalyticsViewEvent[]> {
    return this.transactionalEntityManager
      .getRepository(AnalyticsViewEvent)
      .createQueryBuilder('e')
      .where('e.occurredAt >= :since', { since })
      .andWhere("e.metadata IS NOT NULL")
      .andWhere("e.metadata->'genres' IS NOT NULL")
      .getMany();
  }
}
