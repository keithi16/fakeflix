import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { AnalyticsContentPerformance } from '../entity/analytics-content-performance.entity';

const ALLOWED_SORT_COLUMNS = new Set<string>([
  'totalViews',
  'uniqueViewers',
  'totalWatchTimeMs',
  'avgCompletionPercentage',
  'completionCount',
  'lastComputedAt',
]);

@Injectable()
export class ContentPerformanceRepository extends DefaultTypeOrmRepository<AnalyticsContentPerformance> {
  constructor(@InjectDataSource('analytics') dataSource: DataSource) {
    super(AnalyticsContentPerformance, dataSource.manager);
  }

  async findByContentId(contentId: string): Promise<AnalyticsContentPerformance | null> {
    return this.findOne({ where: { contentId } });
  }

  async findTopByMetric(
    metric: keyof AnalyticsContentPerformance,
    limit: number
  ): Promise<AnalyticsContentPerformance[]> {
    if (!ALLOWED_SORT_COLUMNS.has(metric as string)) {
      throw new Error(`Invalid sort column: ${String(metric)}`);
    }
    return this.transactionalEntityManager
      .getRepository(AnalyticsContentPerformance)
      .createQueryBuilder('cp')
      .orderBy(`cp.${metric}`, 'DESC')
      .take(limit)
      .getMany();
  }

  async findBottomByMetric(
    metric: keyof AnalyticsContentPerformance,
    limit: number
  ): Promise<AnalyticsContentPerformance[]> {
    if (!ALLOWED_SORT_COLUMNS.has(metric as string)) {
      throw new Error(`Invalid sort column: ${String(metric)}`);
    }
    return this.transactionalEntityManager
      .getRepository(AnalyticsContentPerformance)
      .createQueryBuilder('cp')
      .orderBy(`cp.${metric}`, 'ASC')
      .take(limit)
      .getMany();
  }

  async findPaginated(options: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<[AnalyticsContentPerformance[], number]> {
    const qb = this.transactionalEntityManager
      .getRepository(AnalyticsContentPerformance)
      .createQueryBuilder('cp');

    if (options.sortBy) {
      if (!ALLOWED_SORT_COLUMNS.has(options.sortBy)) {
        throw new Error(`Invalid sort column: ${options.sortBy}`);
      }
      qb.orderBy(`cp.${options.sortBy}`, options.sortOrder ?? 'DESC');
    }

    qb.skip((options.page - 1) * options.limit).take(options.limit);

    return qb.getManyAndCount();
  }
}
