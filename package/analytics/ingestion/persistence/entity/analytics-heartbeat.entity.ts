import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'AnalyticsHeartbeat' })
@Index(['sessionId', 'occurredAt'])
@Index(['userId', 'contentId', 'occurredAt'])
export class AnalyticsHeartbeat extends DefaultEntity<AnalyticsHeartbeat> {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'bigint' })
  positionMs: number;

  @Column({ type: 'bigint' })
  durationMs: number;

  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  receivedAt: Date;
}
