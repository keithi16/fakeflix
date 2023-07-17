import { Directive, Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'video ' })
export class Video {
  @Directive('@upper')
  @Field()
  name: string;
}
