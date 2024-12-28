import { Injectable } from '@nestjs/common';
import { VideoMetadataService } from '@src/module/content/core/service/video-metadata.service';
import { VideoProfanityFilterService } from '@src/module/content/core/service/video-profanity-filter.service';
import { Video } from '@src/module/content/persistence/entity/video.entity';

@Injectable()
export class VideoProcessorService {
  constructor(
    private readonly videoMetadataProvider: VideoMetadataService,
    private readonly videoProfanityFilterService: VideoProfanityFilterService
  ) {}

  async processMetadataAndSecurity(video: Video) {
    await this.videoMetadataProvider.setVideoDuration(video);

    //assume it's async and will update the video later
    //TODO: implement the video profanity filter save non transactional
    await this.videoProfanityFilterService.filterProfanity(video);
  }
}
