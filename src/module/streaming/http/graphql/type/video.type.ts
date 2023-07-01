import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'video ' })
export class Video {
  @Field(() => ID)
  id: string;

  @Directive('@upper')
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  creationDate: Date;

  @Field(() => [String])
  ingredients: string[];
}
