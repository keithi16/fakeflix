import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'video ' })
export class Video {
  @Field(() => ID)
  id: string;

  @Field()
  url: string;

  @Field(() => Int, { nullable: true })
  sizeInKb: number | null;

  @Field(() => Float, { nullable: true })
  duration: number | null;
}
