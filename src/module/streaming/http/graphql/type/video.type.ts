import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'video ' })
export class Video {
  @Directive('@upper')
  title: string;
}
