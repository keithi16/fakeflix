import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { MovieContent } from './content.entity';
import { Episode } from './episode.entity';
import { VideoMetadata } from './video-metadata.entity';

// Transformer para converter bigint (string) em number de forma confiável
const bigintTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? Number(value) : value;
  },
};

@Entity({ name: 'Video' })
export class Video extends DefaultEntity<Video> {
  @Column()
  url: string;

  @Column({ type: 'bigint', nullable: true, transformer: bigintTransformer })
  sizeInKb: number | null;

  @Column({ type: 'bigint', nullable: true, transformer: bigintTransformer })
  duration: number | null;

  @OneToOne(() => MovieContent, (movie) => movie.video, { nullable: true })
  @JoinColumn()
  movie: MovieContent | null;

  @OneToOne(() => Episode, (episode) => episode.video, { nullable: true })
  @JoinColumn()
  episode: Episode | null;

  @OneToOne(() => VideoMetadata, (textMetadata) => textMetadata.video, {
    cascade: true,
  })
  metadata: VideoMetadata;
}
