import { Injectable } from '@nestjs/common';
import { Video } from '@src/module/content/persistence/entity/video.entity';

@Injectable()
export class VideoMetadataService {
  async setVideoDuration(video: Video): Promise<void> {
    video.duration = 100;
  }
}
