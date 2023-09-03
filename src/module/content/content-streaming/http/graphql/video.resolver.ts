import { Query, Resolver } from '@nestjs/graphql';

import { ContentCatalogueService } from '@src/module/content/content-streaming/core/service/content-catalogue.service';
import { Video } from './type/video.type';

@Resolver(() => Video)
export class VideoResolver {
  constructor(private readonly videoCatalogue: ContentCatalogueService) {}
  @Query(() => [Video])
  async listVideos(): Promise<Video[]> {
    return this.videoCatalogue.listVideos();
  }
}
