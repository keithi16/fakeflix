import { Query, Resolver } from '@nestjs/graphql';

import { VideoCatalogueService } from '@src/module/streaming/user-streaming/core/service/video-catalogue.service';
import { Video } from './type/video.type';

@Resolver(() => Video)
export class VideoResolver {
  constructor(protected readonly videoCatalogue: VideoCatalogueService) {}
  @Query(() => [Video])
  async listVideos(): Promise<Video[]> {
    return this.videoCatalogue.list();
  }
}
