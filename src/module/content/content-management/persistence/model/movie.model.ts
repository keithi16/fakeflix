import { DefaultModel } from '@src/shared/module/persistence/typeorm/model/default.model';
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { Content } from './content.model';
import { Video } from './video.model';

@Entity({ name: 'Movie' })
export class Movie extends DefaultModel<Movie> {
  @OneToOne(() => Video, (video) => video.movie, {
    cascade: true,
  })
  video: Video;

  @OneToOne(() => Content, (content) => content.movie)
  @JoinColumn()
  content: Content;
}
