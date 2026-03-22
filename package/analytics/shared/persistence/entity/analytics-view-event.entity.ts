import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index } from 'typeorm';
import { AnalyticsContentType } from '../../enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../enum/analytics-event-type.enum';

@Entity({ name: 'AnalyticsViewEvent' })
@Index(['userId', 'occurredAt'])
@Index(['contentId', 'occurredAt'])
@Index(['sessionId'])
export class AnalyticsViewEvent extends DefaultEntity<AnalyticsViewEvent> {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'enum', enum: AnalyticsContentType })
  contentType: AnalyticsContentType;

  @Column({ type: 'enum', enum: AnalyticsEventType })
  eventType: AnalyticsEventType;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'bigint' })
  positionMs: number;

  @Column({ type: 'bigint' })
  durationMs: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  receivedAt: Date;
}
