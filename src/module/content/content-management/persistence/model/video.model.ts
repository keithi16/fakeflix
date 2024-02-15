import { DefaultModel } from '@src/shared/module/persistence/typeorm/model/default.model';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Episode } from './episode.model';
import { Movie } from './movie.model';

@Entity({ name: 'Video' })
export class Video extends DefaultModel<Video> {
  @Column()
  url: string;

  @Column()
  sizeInKb: number;

  @Column()
  duration: number;

  @OneToOne(() => Movie, (movie) => movie.video)
  @JoinColumn()
  movie: Movie;

  @OneToOne(() => Episode, (episode) => episode.video)
  episode: Episode;
}
