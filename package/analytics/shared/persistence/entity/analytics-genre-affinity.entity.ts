import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity({ name: 'AnalyticsGenreAffinity' })
@Unique(['userId', 'genre'])
@Index(['userId', 'affinityScore'])
export class AnalyticsGenreAffinity extends DefaultEntity<AnalyticsGenreAffinity> {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  genre: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  affinityScore: number;

  @Column({ type: 'bigint', default: 0 })
  totalWatchTimeMs: number;

  @Column({ type: 'int', default: 0 })
  contentCount: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  lastUpdatedAt: Date;
}
