import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaPlayerService {
  async prepareStreaming(videoId: string): Promise<string> {
    return `http://video/${videoId}`;
  }
}
