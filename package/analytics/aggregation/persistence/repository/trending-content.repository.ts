import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';
import { AnalyticsTrendingContent } from '../entity/analytics-trending-content.entity';

@Injectable()
export class TrendingContentRepository extends DefaultTypeOrmRepository<AnalyticsTrendingContent> {
  constructor(@InjectDataSource('analytics') dataSource: DataSource) {
    super(AnalyticsTrendingContent, dataSource.manager);
  }

  async findLatestByWindowType(
    windowType: AnalyticsTrendingWindowType,
    limit?: number
  ): Promise<AnalyticsTrendingContent[]> {
    const qb = this.transactionalEntityManager
      .getRepository(AnalyticsTrendingContent)
      .createQueryBuilder('t')
      .where('t.windowType = :windowType', { windowType })
      .orderBy('t.windowStart', 'DESC')
      .addOrderBy('t.rank', 'ASC');

    if (limit) {
      qb.take(limit);
    }

    return qb.getMany();
  }

  async upsertEntry(data: Partial<AnalyticsTrendingContent>): Promise<AnalyticsTrendingContent> {
    const existing = await this.findOne({
      where: {
        contentId: data.contentId,
        windowType: data.windowType,
        windowStart: data.windowStart,
      },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.save(existing);
    }

    return this.save(new AnalyticsTrendingContent(data));
  }
}
