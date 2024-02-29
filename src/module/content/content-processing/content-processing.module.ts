import { Module } from '@nestjs/common';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { VideoProcessingService } from './core/service/video-processing.service';
import { ContentManagementEventHandler } from './event/content-management.event-handler';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [ContentManagementEventHandler, VideoProcessingService],
})
export class ContentProcessingModule {}
