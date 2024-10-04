import { Injectable } from '@nestjs/common';
import { VideoNotFoundException } from '@src/module/content/core/exception/video-not-found.exception';
import { ContentMediaRepository } from '@src/module/content/persistence/repository/content-media.repository';

@Injectable()
export class MediaPlayerService {
  constructor(private readonly contentMediaRepository: ContentMediaRepository) {}

  async prepareStreaming(videoId: string): Promise<string> {
    const videoMetadata = await this.contentMediaRepository.getVideoById(videoId);
    if (!videoMetadata) {
      throw new VideoNotFoundException(`video with id ${videoId} not found`);
    }
    return videoMetadata.metadata.url;
  }
}
