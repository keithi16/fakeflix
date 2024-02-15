import { DefaultModel } from '@src/shared/module/persistence/typeorm/model/default.model';
import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';
import { Thumbnail } from './thumbnail.model';
import { TvShow } from './tv-show.model';
import { Video } from './video.model';

@Entity('episode')
export class Episode extends DefaultModel<Episode> {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  season: number;

  @Column()
  number: number;

  @ManyToOne(() => TvShow, (tvShow) => tvShow.episodes)
  tvShow: TvShow;

  @OneToOne(() => Thumbnail, (thumbnail) => thumbnail.episode)
  thumbnail: Thumbnail;

  @OneToOne(() => Video, (video) => video.episode)
  video: Video;
}
