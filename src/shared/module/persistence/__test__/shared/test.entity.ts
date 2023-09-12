import { BaseEntity } from '@src/shared/core/entity/base.entity';
import { instanceToPlain } from 'class-transformer';
import { randomUUID } from 'crypto';

export type TestEntityProps = Omit<TestEntity, 'create' | 'serialize'>;
/**
 *
 * @description
 * Setups a a custom entity that extends the abstract class
 * In order to test the generic repository
 */
export class TestEntity extends BaseEntity {
  someField: string;

  constructor(data: TestEntityProps) {
    super(data);
  }

  static create(data: Pick<TestEntityProps, 'someField'>, id = randomUUID()): TestEntity {
    return new TestEntity({
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  serialize() {
    return instanceToPlain(this) as TestEntityProps;
  }
}
