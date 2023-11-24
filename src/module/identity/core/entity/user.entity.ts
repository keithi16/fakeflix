import { Email } from '@src/module/identity/core/value-object/email.value-object';
import { BaseEntity, BaseEntityProps } from '@src/shared/core/entity/base.entity';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export interface UserEntityProps<T extends string | Email = Email>
  extends BaseEntityProps {
  firstName: string;
  lastName: string;
  email: T;
  password: string;
}

//TODO move to a configuration
export const PASSWORD_HASH_SALT = 10;

export class UserEntity extends BaseEntity {
  private firstName: UserEntityProps['firstName'];
  private lastName: UserEntityProps['lastName'];
  private email: UserEntityProps['email'];
  private password: UserEntityProps['password'];

  private constructor(data: UserEntityProps) {
    super(data);
  }

  static async createNew(
    data: Omit<UserEntityProps<string | Email>, 'createdAt' | 'updatedAt' | 'id'>,
    id = randomUUID()
  ): Promise<UserEntity> {
    const hashedPassword = await bcrypt.hash(data.password, PASSWORD_HASH_SALT);

    return new UserEntity({
      ...data,
      email: typeof data.email === 'string' ? new Email(data.email) : data.email,
      id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createFrom(data: UserEntityProps<string | Email>): UserEntity {
    return new UserEntity({
      ...data,
      email: typeof data.email === 'string' ? new Email(data.email) : data.email,
    });
  }

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
  serialize() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email.getValue(),
      password: this.password,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
