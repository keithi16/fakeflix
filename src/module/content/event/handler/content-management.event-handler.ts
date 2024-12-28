import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MovieContentModel } from '@src/module/content/core/model/movie-content.model';
import { VideoProcessingService } from '@src/module/content/core/service/video-processing.service';
import { EntityChangedEvent } from '@src/shared/event/entity-changed.event';

@Injectable()
export class ContentManagementEventHandler {
  constructor(private readonly videoProcessingService: VideoProcessingService) {}
  @OnEvent('content.created')
  async handlerContentCreatedEvent(payload: EntityChangedEvent<MovieContentModel>) {
    this.videoProcessingService.processVideo(payload.entityData);
  }
}
