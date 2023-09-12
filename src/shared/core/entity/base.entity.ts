import { Expose } from 'class-transformer';

//Used for class-transformer serialization in order to expose or hide fields
export enum ExposeFieldControl {
  INTERNAL = 'internal',
  PUBLIC = 'public',
}

export type BaseEntityProps = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export abstract class BaseEntity {
  @Expose()
  readonly id: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;

  constructor(data: BaseEntityProps) {
    Object.assign(this, data);
  }

  abstract serialize(group: ExposeFieldControl): Record<string, unknown>;
}
