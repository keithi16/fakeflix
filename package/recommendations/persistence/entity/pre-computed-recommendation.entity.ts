import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, Index } from 'typeorm';

@Index(['userId'])
@Index(['userId', 'contentId'], { unique: true })
@Entity('recommendations_pre_computed')
export class PreComputedRecommendation extends DefaultEntity<PreComputedRecommendation> {
  @Column()
  userId: string;

  @Column()
  contentId: string;

  @Column('decimal', { precision: 10, scale: 4 })
  score: number;

  @Column()
  rank: number;

  @Column('jsonb', { default: [] })
  matchedGenres: string[];

  @Column()
  computedAt: Date;
}
