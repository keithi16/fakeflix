import { Query, Resolver } from '@nestjs/graphql';

import { CatalogueService } from '@src/module/content/content-streaming/core/service/catalogue.service';
import { Video } from './type/video.type';

@Resolver(() => Video)
export class VideoResolver {
  constructor(private readonly videoCatalogue: CatalogueService) {}
  @Query(() => [Video])
  async listVideos(): Promise<Video[]> {
    return this.videoCatalogue.listVideos();
  }
}
