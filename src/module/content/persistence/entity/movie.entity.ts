import { Thumbnail } from '@src/module/content/persistence/entity/thumbnail.entity';
import { DefaultEntity } from '@src/shared/module/persistence/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Content } from './content.entity';
import { Video } from './video.entity';

@Entity({ name: 'Movie' })
export class Movie extends DefaultEntity<Movie> {
  @Column({ type: 'float', nullable: true })
  externalRating: number | null;

  @OneToOne(() => Video, (video) => video.movie, {
    cascade: true,
    nullable: false,
  })
  video: Video;

  @OneToOne(() => Content, (content) => content.movie)
  @JoinColumn()
  content: Content;

  @OneToOne(() => Thumbnail, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  thumbnail: Thumbnail | null;
}
