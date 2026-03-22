import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index, Unique } from 'typeorm';
import { AnalyticsContentType } from '../../enum/analytics-content-type.enum';

@Entity({ name: 'AnalyticsUserWatchHistory' })
@Unique(['userId', 'contentId'])
@Index(['userId', 'lastWatchedAt'])
export class AnalyticsUserWatchHistory extends DefaultEntity<AnalyticsUserWatchHistory> {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'enum', enum: AnalyticsContentType })
  contentType: AnalyticsContentType;

  @Column({ type: 'bigint', default: 0 })
  lastWatchedPositionMs: number;

  @Column({ type: 'bigint', default: 0 })
  totalWatchTimeMs: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercentage: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'int', default: 0 })
  watchCount: number;

  @Column({ type: 'timestamptz' })
  firstWatchedAt: Date;

  @Column({ type: 'timestamptz' })
  lastWatchedAt: Date;
}
