import { Injectable } from '@nestjs/common';
import { VideoRepository } from '@src/module/content/shared/storage/repository/video.repository';

@Injectable()
export class MediaPlayerService {
  constructor(protected readonly videoRepository: VideoRepository) {}
  async prepareStreaming(videoId: string): Promise<string> {
    const video = await this.videoRepository.findOne(videoId);
    if (!video) {
      //TODO create a custom error that extends from domain exception
      throw new Error('Video not found');
    }

    return video.videoUrl;
  }
}
