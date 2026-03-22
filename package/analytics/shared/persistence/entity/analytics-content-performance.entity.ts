import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index, Unique } from 'typeorm';
import { AnalyticsContentType } from '../../enum/analytics-content-type.enum';

@Entity({ name: 'AnalyticsContentPerformance' })
@Unique(['contentId'])
@Index(['contentType', 'totalViews'])
export class AnalyticsContentPerformance extends DefaultEntity<AnalyticsContentPerformance> {
  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'enum', enum: AnalyticsContentType })
  contentType: AnalyticsContentType;

  @Column({ type: 'int', default: 0 })
  totalViews: number;

  @Column({ type: 'int', default: 0 })
  uniqueViewers: number;

  @Column({ type: 'bigint', default: 0 })
  totalWatchTimeMs: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  avgCompletionPercentage: number;

  @Column({ type: 'int', default: 0 })
  completionCount: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  lastComputedAt: Date;
}
