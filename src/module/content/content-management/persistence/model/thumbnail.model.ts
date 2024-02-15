import { DefaultModel } from '@src/shared/module/persistence/typeorm/model/default.model';
import { Column, Entity, OneToOne } from 'typeorm';
import { Content } from './content.model';
import { Episode } from './episode.model';

@Entity({ name: 'Thumbnail' })
export class Thumbnail extends DefaultModel<Thumbnail> {
  @Column()
  url: string;

  @OneToOne(() => Episode, (episode) => episode.thumbnail)
  episode: Episode;

  @OneToOne(() => Content, (content) => content.thumbnail)
  content: Content;
}
