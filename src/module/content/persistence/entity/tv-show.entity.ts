import { Thumbnail } from '@src/module/content/persistence/entity/thumbnail.entity';
import { DefaultEntity } from '@src/shared/module/persistence/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Content } from './content.entity';
import { Episode } from './episode.entity';

@Entity({ name: 'TvShow' })
export class TvShow extends DefaultEntity<TvShow> {
  @OneToMany(() => Episode, (episode) => episode.tvShow, {
    cascade: false, //disable cascade create/update to avoid replacament of existing episodes
    onDelete: 'CASCADE',
  })
  episodes: Episode[];

  @OneToOne(() => Content)
  @JoinColumn()
  content: Content;

  @Column({ type: 'uuid', nullable: false })
  contentId: string;

  @OneToOne(() => Thumbnail, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  thumbnail: Thumbnail;
}
