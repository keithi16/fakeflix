import { VideoMetadata } from '@tlc/content/persistence/entity/video-metadata.entity';
import { DefaultEntity } from '@tlc/shared-module/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Episode } from './episode.entity';
import { Movie } from './movie.entity';

@Entity({ name: 'Video' })
export class Video extends DefaultEntity<Video> {
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
  @JoinColumn()
  episode: Episode;

  @OneToOne(() => VideoMetadata, (textMetadata) => textMetadata.video, {
    cascade: true,
  })
  @JoinColumn()
  metadata: VideoMetadata;
}
