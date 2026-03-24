import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'ContentThumbnail' })
export class Thumbnail extends DefaultEntity<Thumbnail> {
  @Column()
  url: string;
}
