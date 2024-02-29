import { Injectable } from '@nestjs/common';
import { VideoNotFoundException } from '@src/module/content/content-streaming/core/exception/video-not-found.exception';
import { ContentRepository } from '@src/module/content/content-streaming/persistence/repository/content.repository';

@Injectable()
export class MediaPlayerService {
  constructor(private readonly contentRepository: ContentRepository) {}

  async prepareStreaming(videoId: string): Promise<string> {
    const videoMetadata = await this.contentRepository.getVideoById(videoId);
    if (!videoMetadata) {
      throw new VideoNotFoundException(`video with id ${videoId} not found`);
    }
    return videoMetadata.metadata.url;
  }
}
