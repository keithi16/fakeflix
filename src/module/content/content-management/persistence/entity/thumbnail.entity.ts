import { DefaultEntity } from '@src/shared/module/persistence/typeorm/entity/default.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { Content } from './content.entity';
import { Episode } from './episode.entity';

@Entity({ name: 'Thumbnail' })
export class Thumbnail extends DefaultEntity<Thumbnail> {
  @Column()
  url: string;

  @OneToOne(() => Episode, (episode) => episode.thumbnail)
  episode: Episode;

  @OneToOne(() => Content, (content) => content.thumbnail)
  content: Content;
}
