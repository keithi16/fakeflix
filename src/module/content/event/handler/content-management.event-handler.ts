import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VideoProcessingService } from '@src/module/content/core/service/video-processing.service';
import { Content } from '@src/module/content/persistence/entity/content.entity';
import { EntityChangedEvent } from '@src/shared/event/entity-changed.event';

@Injectable()
export class ContentManagementEventHandler {
  constructor(private readonly videoProcessingService: VideoProcessingService) {}
  @OnEvent('content.created')
  async handlerContentCreatedEvent(payload: EntityChangedEvent<Content>) {
    this.videoProcessingService.processVideo(payload.entityData);
  }
}
