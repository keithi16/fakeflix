import { DefaultModel } from '@src/shared/module/persistence/typeorm/model/default.model';
import { Entity, OneToMany, OneToOne } from 'typeorm';
import { Content } from './content.model';
import { Episode } from './episode.model';

@Entity({ name: 'TvShow' })
export class TvShow extends DefaultModel<TvShow> {
  @OneToMany(() => Episode, (episode) => episode.tvShow)
  episodes: Episode[];

  @OneToOne(() => Content)
  content: Content;
}
