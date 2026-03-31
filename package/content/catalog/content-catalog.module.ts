import { Module } from '@nestjs/common'
import { HttpClientModule } from '@tlc/shared-module/http-client'
import { LoggerModule } from '@tlc/shared-module/logger'
import { ContentCatalogApi } from '@tlc/shared-module/public-api'
import { ContentSharedModule } from '../shared/content-shared.module'
import { ContentMediaModule } from '../media/content-media.module'
import { GetStreamingURLUseCase } from './core/use-case/get-streaming-url.use-case'
import { ListContentUseCase } from './core/use-case/list-content.use-case'
import { ListCatalogContentUseCase } from './core/use-case/list-catalog-content.use-case'
import { ContentResolver } from './http/graphql/resolver/content.resolver'
import { VideoResolver } from './http/graphql/resolver/video.resolver'
import { VideoStreamingService } from './core/service/video-streaming.service'
import { MediaPlayerController } from './http/rest/controller/media-player.controller'
import { CatalogContentRepository } from './persistence/repository/catalog-content.repository'
import { ContentCatalogFacade } from './public-api/facade/content-catalog.facade'

@Module({
  imports: [ContentSharedModule, ContentMediaModule, LoggerModule, HttpClientModule],
  providers: [
    CatalogContentRepository,
    ListCatalogContentUseCase,
    { provide: ContentCatalogApi, useClass: ContentCatalogFacade },
    ContentResolver,
    VideoResolver,
    GetStreamingURLUseCase,
    ListContentUseCase,
    VideoStreamingService,
  ],
  controllers: [MediaPlayerController],
  exports: [ContentCatalogApi],
})
export class ContentCatalogModule {}
