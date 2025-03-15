import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MovieContentModel } from '@tlc/content/core/model/movie-content.model';
import { VideoProcessingService } from '@tlc/content/core/service/video-processing.service';
import { ContentManagementOperationType } from '@tlc/shared-lib/event/content/content-management.event';
import { EntityChangedEvent } from '@tlc/shared-lib/event/entity-changed.event';

@Injectable()
export class ContentManagementEventHandler {
  constructor(private readonly videoProcessingService: VideoProcessingService) {}
  @OnEvent(ContentManagementOperationType.CONTENT_CREATED)
  async handlerContentCreatedEvent(payload: EntityChangedEvent<MovieContentModel>) {
    this.videoProcessingService.processVideo(payload.entityData);
  }
}
