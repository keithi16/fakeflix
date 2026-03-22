import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index, Unique } from 'typeorm';
import { AnalyticsContentType } from '../../enum/analytics-content-type.enum';
import { AnalyticsTrendingWindowType } from '../../enum/analytics-trending-window-type.enum';

@Entity({ name: 'AnalyticsTrendingContent' })
@Unique(['contentId', 'windowType', 'windowStart'])
@Index(['windowType', 'rank'])
export class AnalyticsTrendingContent extends DefaultEntity<AnalyticsTrendingContent> {
  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'enum', enum: AnalyticsContentType })
  contentType: AnalyticsContentType;

  @Column({ type: 'enum', enum: AnalyticsTrendingWindowType })
  windowType: AnalyticsTrendingWindowType;

  @Column({ type: 'timestamptz' })
  windowStart: Date;

  @Column({ type: 'timestamptz' })
  windowEnd: Date;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  uniqueViewers: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  trendingScore: number;

  @Column({ type: 'int', default: 0 })
  rank: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  computedAt: Date;
}
