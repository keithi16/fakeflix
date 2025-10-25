import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { TvShowContent } from './content.entity';
import { Thumbnail } from './thumbnail.entity';
import { Video } from './video.entity';

@Entity('Episode')
export class Episode extends DefaultEntity<Episode> {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  season: number;

  @Column()
  number: number;

  @Column()
  tvShowId: string;

  @ManyToOne(() => TvShowContent, (tvShow) => tvShow.episodes)
  tvShow: TvShowContent;

  @OneToOne(() => Thumbnail)
  @JoinColumn()
  thumbnail: Thumbnail | null;

  @OneToOne(() => Video, (video) => video.episode, {
    cascade: true,
    nullable: false,
  })
  video: Video;
}
