import { DefaultEntity } from '@tlc/shared-module/typeorm/entity/default.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'User' })
export class User extends DefaultEntity<User> {
  @PrimaryColumn()
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
}
