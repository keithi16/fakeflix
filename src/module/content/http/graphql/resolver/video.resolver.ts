import { Query, Resolver } from '@nestjs/graphql';

import { Video } from '@src/module/content/http/graphql/type/video.type';

@Resolver(() => Video)
export class VideoResolver {
  @Query(() => [Video])
  async listVideos(): Promise<Video[]> {
    //TODO implement it
    return [{ name: 'video1' }, { name: 'video2' }];
  }
}
