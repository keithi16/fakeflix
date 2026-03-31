import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity } from 'typeorm';
import { PublishingStatus } from '../../core/enum/publishing-status.enum';

@Entity({ name: 'ContentTransition' })
export class ContentTransition extends DefaultEntity<ContentTransition> {
  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'enum', enum: PublishingStatus })
  previousState: PublishingStatus;

  @Column({ type: 'enum', enum: PublishingStatus })
  newState: PublishingStatus;

  @Column({ type: 'varchar' })
  triggeredBy: string;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  transitionedAt: Date;
}
