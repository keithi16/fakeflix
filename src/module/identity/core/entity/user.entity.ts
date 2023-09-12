import { Email } from '@src/module/identity/core/value-object/email.value-object';
import {
  BaseEntity,
  BaseEntityProps,
  ExposeFieldControl,
} from '@src/shared/core/entity/base.entity';
import bcrypt from 'bcrypt';
import { Exclude, Expose, instanceToPlain } from 'class-transformer';
import { randomUUID } from 'crypto';

export type UserEntityProps<T = Email | string> = Pick<
  UserEntity,
  'firstName' | 'lastName' | 'password'
> & {
  email: T;
};

export type PublicUserEntityProps = Omit<UserEntityProps<string>, 'password'> &
  BaseEntityProps;

//TODO move to a configuration
export const PASSWORD_HASH_SALT = 10;

export class UserEntity extends BaseEntity {
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
  @Exclude()
  email: Email;
  @Expose({ groups: ['internal'] })
  password: string;

  constructor(data: UserEntityProps & BaseEntityProps) {
    super(data);
    this.email = typeof data.email === 'string' ? new Email(data.email) : data.email;
  }

  @Expose({ name: 'email' })
  getEmailString(): string {
    return this.email.getValue();
  }
  static async create(data: UserEntityProps, id = randomUUID()): Promise<UserEntity> {
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

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
  serialize(group: ExposeFieldControl = ExposeFieldControl.PUBLIC) {
    //password is not exposed to the public
    if (group === ExposeFieldControl.INTERNAL) {
      return instanceToPlain(this, { groups: [group] }) as UserEntityProps<string> &
        BaseEntityProps;
    }
    return instanceToPlain(this, { groups: [group] }) as PublicUserEntityProps;
  }
}
