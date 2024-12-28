import { ContentType } from '@src/module/content/core/enum/content-type.enum';
import { DefaultEntity } from '@src/shared/module/persistence/typeorm/entity/default.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { Movie } from './movie.entity';
import { TvShow } from './tv-show.entity';

@Entity({ name: 'Content' })
export class Content extends DefaultEntity<Content> {
  @Column({ nullable: false, type: 'enum', enum: ContentType })
  type: ContentType;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  description: string;

  @Column({ type: 'int', nullable: true })
  ageRecommendation: number | null;

  @Column({ type: 'date', nullable: true })
  releaseDate: Date | null;

  @OneToOne(() => Movie, (movie) => movie.content, {
    cascade: true,
    nullable: true,
  })
  movie: Movie | null;

  @OneToOne(() => TvShow, (tvShow) => tvShow.content, {
    cascade: true,
    nullable: true,
  })
  tvShow: TvShow | null;
}
