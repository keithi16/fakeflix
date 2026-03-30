import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index } from 'typeorm';

@Index(['userId'])
@Index(['userId', 'contentId'], { unique: true })
@Entity('recommendations_continue_watching_dismiss')
export class ContinueWatchingDismiss extends DefaultEntity<ContinueWatchingDismiss> {
  @Column()
  userId: string;

  @Column()
  contentId: string;

  @Column()
  dismissedAt: Date;
}
