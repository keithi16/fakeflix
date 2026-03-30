import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { ContinueWatchingDismiss } from '../entity/continue-watching-dismiss.entity';

@Injectable()
export class ContinueWatchingDismissRepository extends DefaultTypeOrmRepository<ContinueWatchingDismiss> {
  constructor(
    @InjectDataSource('recommendations')
    dataSource: DataSource
  ) {
    super(ContinueWatchingDismiss, dataSource.manager);
  }

  async findByUserId(userId: string): Promise<ContinueWatchingDismiss[]> {
    return this.find({ where: { userId } });
  }

  async dismiss(userId: string, contentId: string): Promise<void> {
    const existing = await this.findOne({ where: { userId, contentId } });
    if (existing) {
      existing.dismissedAt = new Date();
      await this.save(existing);
    } else {
      await this.save(new ContinueWatchingDismiss({ userId, contentId, dismissedAt: new Date() }));
    }
  }
}
