import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'AnalyticsBingeSession' })
@Index(['userId', 'startedAt'])
export class AnalyticsBingeSession extends DefaultEntity<AnalyticsBingeSession> {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  seriesContentId: string;

  @Column({ type: 'int', default: 0 })
  episodeCount: number;

  @Column({ type: 'bigint', default: 0 })
  totalWatchTimeMs: number;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;
}
