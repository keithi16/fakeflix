import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MovieContentModel } from '@src/module/content/core/model/movie-content.model';
import { ContentProcessingEvent } from '@src/shared/event/content/content-processing.event';
import { EntityChangedEvent } from '@src/shared/event/entity-changed.event';
import { instanceToInstance } from 'class-transformer';

@Injectable()
export class VideoProcessingService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

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
