import { Injectable } from '@nestjs/common';
import { VideoNotFoundException } from '@src/module/content/content-streaming/core/exception/video-not-found.exception';
import { VideoRepository } from '@src/module/content/content-streaming/persistence/repository/video.repository';

@Injectable()
export class MediaPlayerService {
  constructor(private readonly videoRepository: VideoRepository) {}
  async prepareStreaming(videoId: string): Promise<string> {
    const video = await this.videoRepository.findOne({ id: videoId });
    if (!video) {
      throw new VideoNotFoundException('Video not found');
    }

    return video.videoUrl;
  }
}
