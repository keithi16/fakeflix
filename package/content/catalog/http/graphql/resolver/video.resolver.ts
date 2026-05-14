import { Query, Resolver } from '@nestjs/graphql';

import { ListVideosUseCase } from '../../../core/use-case/list-videos.use-case';
import { Video } from '../type/video.type';

@Resolver(() => Video)
export class VideoResolver {
  constructor(private readonly listVideosUseCase: ListVideosUseCase) {}

  @Query(() => [Video])
  async listVideos(): Promise<Video[]> {
    const videos = await this.listVideosUseCase.execute();
    return videos.map((video) => ({
      id: video.id,
      url: video.url,
      sizeInKb: video.sizeInKb,
      duration: video.duration,
    }));
  }
}
