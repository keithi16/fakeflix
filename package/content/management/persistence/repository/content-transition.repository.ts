import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { ContentTransition } from '../../../shared/persistence/entity/content-transition.entity';

@Injectable()
export class ContentTransitionRepository extends DefaultTypeOrmRepository<ContentTransition> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource,
  ) {
    super(ContentTransition, dataSource.manager);
  }

  async findRecentTransitions(limit = 50): Promise<ContentTransition[]> {
    return this.find({
      order: { transitionedAt: 'DESC' },
      take: limit,
    });
  }

  async findByContentId(contentId: string): Promise<ContentTransition[]> {
    return this.find({
      where: { contentId },
      order: { transitionedAt: 'DESC' },
    });
  }
}
