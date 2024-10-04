import { DefaultEntity } from '@src/shared/module/persistence/typeorm/entity/default.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'Thumbnail' })
export class Thumbnail extends DefaultEntity<Thumbnail> {
  @Column()
  url: string;
}
