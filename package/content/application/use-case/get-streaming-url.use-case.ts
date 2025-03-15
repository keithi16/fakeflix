import { Injectable } from '@nestjs/common';
import { VideoNotFoundException } from '@tlc/content/core/exception/video-not-found.exception';
import { ContentMediaRepository } from '@tlc/content/persistence/repository/content-media.repository';

@Injectable()
export class GetStreamingURLUseCase {
  constructor(private readonly contentMediaRepository: ContentMediaRepository) {}

  async execute(videoId: string): Promise<string> {
    const videoMetadata = await this.contentMediaRepository.getVideoById(videoId);
    if (!videoMetadata) {
      throw new VideoNotFoundException(`video with id ${videoId} not found`);
    }
    return videoMetadata.metadata.url;
  }
}
