import { DefaultEntity } from '@src/shared/module/persistence/typeorm/entity/default.entity';
import { Entity, OneToMany, OneToOne } from 'typeorm';
import { Content } from './content.entity';
import { Episode } from './episode.entity';

@Entity({ name: 'TvShow' })
export class TvShow extends DefaultEntity<TvShow> {
  @OneToMany(() => Episode, (episode) => episode.tvShow)
  episodes: Episode[];

  @OneToOne(() => Content)
  content: Content;
}
