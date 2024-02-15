import { ContentType } from '@src/module/content/content-management/core/enum/content-type.enum';
import { DefaultModel } from '@src/shared/module/persistence/typeorm/model/default.model';
import { Column, Entity, OneToOne } from 'typeorm';
import { Movie } from './movie.model';
import { Thumbnail } from './thumbnail.model';
import { TvShow } from './tv-show.model';

@Entity({ name: 'Content' })
export class Content extends DefaultModel<Content> {
  //todo add enum
  @Column({ nullable: false, type: 'enum', enum: ContentType })
  type: ContentType;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  description: string;

  @OneToOne(() => Thumbnail, (thumbnail) => thumbnail.content, {
    cascade: true,
  })
  thumbnail: Thumbnail;

  @OneToOne(() => Movie, (movie) => movie.content, {
    cascade: true,
  })
  movie: Movie;

  @OneToOne(() => TvShow, (tvShow) => tvShow.content, {
    cascade: true,
  })
  tvShow: TvShow;
}
