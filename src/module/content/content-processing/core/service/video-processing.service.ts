import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Content } from '@src/module/content/content-management/persistence/entity/content.entity';
import { ContentProcessingEvent } from '@src/shared/events/content/content-processing.event';
import { EntityChangedEvent } from '@src/shared/events/entity-changed.event';
import { instanceToInstance } from 'class-transformer';

@Injectable()
export class VideoProcessingService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  processVideo(content: Content) {
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
