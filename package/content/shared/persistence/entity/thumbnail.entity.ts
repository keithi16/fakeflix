import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'Thumbnail' })
export class Thumbnail extends DefaultEntity<Thumbnail> {
  @Column()
  url: string;
}
