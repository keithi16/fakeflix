import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { ChildEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, TableInheritance } from 'typeorm';
import { ContentType } from '../../core/enum/content-type.enum';
import { Episode } from './episode.entity';
import { Thumbnail } from './thumbnail.entity';
import { Video } from './video.entity';

@Entity({ name: 'Content' })
@TableInheritance({ column: { type: 'enum', name: 'type', enum: ContentType } })
export abstract class Content extends DefaultEntity<Content> {
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
}

@ChildEntity(ContentType.MOVIE)
export class MovieContent extends Content {
  @Column({ type: 'float', nullable: true })
  externalRating: number | null;

  @OneToOne(() => Video, (video) => video.movie, {
    cascade: true,
    nullable: false,
  })
  video: Video;

  @OneToOne(() => Thumbnail, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  thumbnail: Thumbnail | null;

  static create(data: {
    title: string;
    description: string;
    ageRecommendation: number | null;
    externalRating: number | null;
    video: Video;
    thumbnail: Thumbnail | null;
    releaseDate?: Date | null;
  }): MovieContent {
    const movie = new MovieContent({
      ...data,
      type: ContentType.MOVIE,
    } as Partial<MovieContent>);
    return movie;
  }
}

@ChildEntity(ContentType.TV_SHOW)
export class TvShowContent extends Content {
  @OneToMany(() => Episode, (episode) => episode.tvShow, {
    cascade: false,
    onDelete: 'CASCADE',
  })
  episodes: Episode[];

  @OneToOne(() => Thumbnail, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  thumbnail: Thumbnail;

  static create(data: {
    title: string;
    description: string;
    ageRecommendation: number | null;
    releaseDate: Date | null;
    thumbnail?: Thumbnail;
  }): TvShowContent {
    const tvShow = new TvShowContent({
      ...data,
      type: ContentType.TV_SHOW,
    } as Partial<TvShowContent>);
    return tvShow;
  }
}
