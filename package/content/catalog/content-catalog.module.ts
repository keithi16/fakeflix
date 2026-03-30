import { Module } from '@nestjs/common';
import { HttpClientModule } from '@tlc/shared-module/http-client';
import { LoggerModule } from '@tlc/shared-module/logger';
import { ContentSharedModule } from '../shared/content-shared.module';
import { ContentMediaModule } from '../media/content-media.module';
import { ContentManagementModule } from '../management/content-management.module';
import { GetStreamingURLUseCase } from './core/use-case/get-streaming-url.use-case';
import { ListContentUseCase } from './core/use-case/list-content.use-case';
import { ContentResolver } from './http/graphql/resolver/content.resolver';
import { VideoResolver } from './http/graphql/resolver/video.resolver';
import { VideoStreamingService } from './core/service/video-streaming.service';
import { MediaPlayerController } from './http/rest/controller/media-player.controller';

@Module({
  imports: [ContentSharedModule, ContentMediaModule, LoggerModule, HttpClientModule, ContentManagementModule],
  providers: [
    ContentResolver,
    VideoResolver,
    GetStreamingURLUseCase,
    ListContentUseCase,
    VideoStreamingService,
  ],
  controllers: [MediaPlayerController],
  exports: [ContentManagementModule],
})
export class ContentCatalogModule {}
