import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Content } from '@src/module/content/content-management/persistence/entity/content.entity';
import { VideoProcessingService } from '@src/module/content/content-processing/core/service/video-processing.service';
import { EntityChangedEvent } from '@src/shared/events/entity-changed.event';

@Injectable()
export class ContentManagementEventHandler {
  constructor(private readonly videoProcessingService: VideoProcessingService) {}
  @OnEvent('content.created')
  async handlerContentCreatedEvent(payload: EntityChangedEvent<Content>) {
    this.videoProcessingService.processVideo(payload.entityData);
  }
}
