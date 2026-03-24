import { Injectable } from '@nestjs/common';
import { VideoNotFoundException } from '../../../shared/core/exception/video-not-found.exception';
import { MediaFacade } from '../../../media/public-api/facade/media.facade';

@Injectable()
export class GetStreamingURLUseCase {
  constructor(private readonly mediaFacade: MediaFacade) {}

  async execute(videoId: string): Promise<string> {
    const url = await this.mediaFacade.findVideoUrlById(videoId);
    if (!url) {
      throw new VideoNotFoundException(`video with id ${videoId} not found`);
    }
    return url;
  }
}
