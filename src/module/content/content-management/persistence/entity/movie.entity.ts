import { DefaultEntity } from '@src/shared/module/persistence/typeorm/entity/default.entity';
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { Content } from './content.entity';
import { Video } from './video.entity';

@Entity({ name: 'Movie' })
export class Movie extends DefaultEntity<Movie> {
  @OneToOne(() => Video, (video) => video.movie, {
    cascade: true,
  })
  video: Video;

  @OneToOne(() => Content, (content) => content.movie)
  @JoinColumn()
  content: Content;
}
