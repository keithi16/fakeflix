import { Module } from '@nestjs/common';
import { SharedStreamingModule } from '@src/module/content/shared/streaming-shared.module';
import { VideoManagerService } from './core/service/video-manager.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/controller/video-upload.controller';

@Module({
  imports: [SharedStreamingModule],
  providers: [VideoResolver, VideoManagerService],
  controllers: [VideoUploadController],
})
export class ContentManagementModule {}
