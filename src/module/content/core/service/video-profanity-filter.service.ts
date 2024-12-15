import { Injectable } from '@nestjs/common';
import { Video } from '@src/module/content/persistence/entity/video.entity';

@Injectable()
export class VideoProfanityFilterService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async filterProfanity(_video: Video) {
    return 'profanity-filtered';
  }
}
