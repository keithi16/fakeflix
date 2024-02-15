import { randomUUID } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class DefaultModel<T> extends BaseEntity {
  constructor(data: Partial<T>) {
    super();
    Object.assign(this, data);
  }
  @BeforeInsert()
  protected beforeInsert(): void {
    this.id = this.id || randomUUID();
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  protected beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //TODO add soft remove
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
