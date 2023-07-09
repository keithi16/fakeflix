import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Video } from './type/video.type';
import { NewVideoInput } from './dto/create-video.dto';

@Resolver(() => Video)
export class VideoResolver {
  @Query(() => [Video])
  async listVideos(): Promise<Video[]> {
    return [];
  }

  @Mutation(() => Video)
  async addVideo(
    @Args('newVideoData') newVideoData: NewVideoInput
  ): Promise<Video | undefined> {
    console.log(newVideoData);
    return undefined;
  }
}
