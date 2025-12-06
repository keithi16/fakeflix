import { Module } from '@nestjs/common';
import { HttpClientModule } from '@tlc/shared-module/http-client';
import { LoggerModule } from '@tlc/shared-module/logger';
import { ContentSharedModule } from '../shared/content-shared.module';
// Player feature
import { GetStreamingURLUseCase } from './player/core/use-case/get-streaming-url.use-case';
import { VideoResolver } from './player/http/graphql/resolver/video.resolver';
import { MediaPlayerController } from './player/http/rest/controller/media-player.controller';
// Content listing feature
import { ListContentUseCase } from './content-listing/core/use-case/list-content.use-case';
import { ContentResolver } from './content-listing/http/graphql/resolver/content.resolver';

@Module({
  imports: [ContentSharedModule, LoggerModule, HttpClientModule],
  providers: [ContentResolver, VideoResolver, GetStreamingURLUseCase, ListContentUseCase],
  controllers: [MediaPlayerController],
})
export class ContentCatalogModule {}
