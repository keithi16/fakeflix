import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MovieContentModel } from '@src/module/content/core/model/movie-content.model';
import { VideoMetadataService } from '@src/module/content/core/service/video-metadata.service';
import { VideoProfanityFilterService } from '@src/module/content/core/service/video-profanity-filter.service';
import { Video } from '@src/module/content/persistence/entity/video.entity';
import { ContentProcessingEvent } from '@src/shared/event/content/content-processing.event';
import { EntityChangedEvent } from '@src/shared/event/entity-changed.event';
import { instanceToInstance } from 'class-transformer';

@Injectable()
export class VideoProcessingService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly videoMetadataProvider: VideoMetadataService,
    private readonly videoProfanityFilterService: VideoProfanityFilterService
  ) {}

  async processMetadataAndSecurity(video: Video) {
    await this.videoMetadataProvider.setVideoDuration(video);

    //assume it's async and will update the video later
    //TODO: implement the video profanity filter save non transactional
    await this.videoProfanityFilterService.filterProfanity(video);
  }

  //use for event handler example
  processVideo(content: MovieContentModel) {
    /**
     * Clones the content instance
     */
    const newContent = instanceToInstance(content);
    /**
     * Updates the duration of the video
     */

    newContent.movie.video.duration = 100;
    /**
     * Emits a new event
     */
    this.eventEmitter.emit(
      ContentProcessingEvent.CONTENT_PROCESSED,
      new EntityChangedEvent(
        ContentProcessingEvent.CONTENT_PROCESSED,
        newContent.id,
        newContent
      )
    );
  }
}
