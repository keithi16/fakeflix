import { Injectable } from '@nestjs/common';
import { VideoNotFoundException } from '@tlc/content/shared/core/exception/video-not-found.exception';
import { VideoRepository } from '@tlc/content/video-processor/persistence/repository/video.repository';

@Injectable()
export class GetStreamingURLUseCase {
  constructor(private readonly videoRepository: VideoRepository) {}

  async execute(videoId: string): Promise<string> {
    const video = await this.videoRepository.findOneById(videoId);
    if (!video) {
      throw new VideoNotFoundException(`video with id ${videoId} not found`);
    }
    return video.url;
  }
}
