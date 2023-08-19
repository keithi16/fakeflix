import { Query, Resolver } from '@nestjs/graphql';

import { Video } from './type/video.type';

@Resolver(() => Video)
export class VideoResolver {
  @Query(() => [Video])
  async listVideos(): Promise<Video[]> {
    return [{ name: 'video1' }, { name: 'video2' }];
  }
}
