import { Module } from '@nestjs/common';
import { GetStreamingURLUseCase } from '@tlc/content/catalog/core/use-case/get-streaming-url.use-case';
import { ListContentUseCase } from '@tlc/content/catalog/core/use-case/list-content.use-case';
import { ContentResolver } from '@tlc/content/catalog/http/graphql/resolver/content.resolver';
import { VideoResolver } from '@tlc/content/catalog/http/graphql/resolver/video.resolver';
import { MediaPlayerController } from '@tlc/content/catalog/http/rest/controller/media-player.controller';
import { ContentSharedModule } from '@tlc/content/shared/content-shared.module';
import { HttpClientModule } from '@tlc/shared-module/http-client/http-client.module';
import { LoggerModule } from '@tlc/shared-module/logger/logger.module';

@Module({
  imports: [ContentSharedModule, LoggerModule, HttpClientModule],
  providers: [ContentResolver, VideoResolver, GetStreamingURLUseCase, ListContentUseCase],
  controllers: [MediaPlayerController],
})
export class ContentCatalogModule {}
