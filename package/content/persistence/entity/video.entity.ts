import { VideoMetadata } from '@tlc/content/persistence/entity/video-metadata.entity';
import { DefaultEntity } from '@tlc/shared-module/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Episode } from './episode.entity';
import { Movie } from './movie.entity';

@Entity({ name: 'Video' })
export class Video extends DefaultEntity<Video> {
  @Column()
  url: string;

  @Column({ type: 'bigint', nullable: true })
  sizeInKb: number | null;

  @Column({ type: 'bigint', nullable: true })
  duration: number | null;

  @OneToOne(() => Movie, (movie) => movie.video)
  @JoinColumn()
  movie: Movie;

  @Column({ type: 'uuid', nullable: false })
  movieId: string;

  @OneToOne(() => Episode, (episode) => episode.video)
  @JoinColumn()
  episode: Episode;

  @OneToOne(() => VideoMetadata, (textMetadata) => textMetadata.video, {
    cascade: true,
  })
  metadata: VideoMetadata;
}
