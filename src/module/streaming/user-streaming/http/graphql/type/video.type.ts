import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'video ' })
export class Video {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  videoUrl: string;
  @Field()
  thumbnailUrl: string | null;

  @Field()
  sizeInKb: number;

  @Field()
  duration: number;
}
