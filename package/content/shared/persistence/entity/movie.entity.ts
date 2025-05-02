import { Thumbnail } from '@tlc/content/shared/persistence/entity/thumbnail.entity';
import { DefaultEntity } from '@tlc/shared-module/typeorm/entity/default.entity';
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

  @Column({ type: 'uuid', nullable: false })
  contentId: string;

  @OneToOne(() => Thumbnail, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  thumbnail: Thumbnail | null;
}
