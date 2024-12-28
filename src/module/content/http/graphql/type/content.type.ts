import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'content' })
export class Content {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  type: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
