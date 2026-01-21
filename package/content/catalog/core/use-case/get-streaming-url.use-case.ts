import { Injectable } from '@nestjs/common';
import { VideoNotFoundException } from '../../../shared/core/exception/video-not-found.exception';
import { VideoRepository } from '../../../video-processor/persistence/repository/video.repository';

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
