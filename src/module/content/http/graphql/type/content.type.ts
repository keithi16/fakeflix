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
  thumbnail?: Thumbnail;

  // @Field()
  // media: Promise<Media>;

  @Field()
  type: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType({ description: 'media' })
export class Media {
  @Field()
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  video: Promise<Video>;
}

@ObjectType({ description: 'thumbnail' })
export class Thumbnail {
  @Field()
  url: string;
}

@ObjectType({ description: 'video' })
export class Video {
  @Field()
  id: string;

  @Field()
  url: string;

  @Field()
  duration: number;

  @Field()
  sizeInKb: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
