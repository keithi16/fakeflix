import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VideoUploadService } from '@src/module/streaming/domain/service/video-upload.service';
import { UploadVideoInput } from './dto/upload-video-input';

import { Video } from './type/video.type';

@Resolver(() => Video)
export class VideoResolver {
  constructor(private readonly videoUploadService: VideoUploadService) {}

  @Query(() => [Video])
  async listVideos(): Promise<Video[]> {
    return [{ name: 'video1' }, { name: 'video2' }];
  }

  @Mutation(() => Video)
  async saveVideo(
    @Args('newVideoData') uploadVideoInput: UploadVideoInput
  ): Promise<Video | undefined> {
    return await this.videoUploadService.uploadVideo(uploadVideoInput);
  }
}
