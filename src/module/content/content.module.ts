import { Module } from '@nestjs/common';
import { ContentIndexingService } from '@src/module/content/core/service/content-indexing.service';
import { MediaPlayerService } from '@src/module/content/core/service/media-player.service';
import { VideoProcessingService } from '@src/module/content/core/service/video-processing.service';
import { ContentManagementEventHandler } from '@src/module/content/event/handler/content-management.event-handler';
import { ContentProcessingEventHandler } from '@src/module/content/event/handler/content-processing.event-handler';
import { ExternalMovieRatingClient } from '@src/module/content/http/client/external-movie-rating/external-movie-rating.client';
import { MediaPlayerController } from '@src/module/content/http/rest/controller/media-player.controller';
import { ContentMediaRepository } from '@src/module/content/persistence/repository/content-media.repository';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { EventEmitterModule } from '@src/shared/module/event/event-emitter.module';
import { HttpClientModule } from '@src/shared/module/http-client/http-client.module';
import { LoggerModule } from '@src/shared/module/logger/logger.module';
import { DynamoDBPersistenceModule } from '@src/shared/module/persistence/dynamodb/dynamodb.module';
import { ContentManagementService } from './core/service/content-management.service';
import { VideoResolver } from './http/graphql/resolver/video.resolver';
import { VideoUploadController } from './http/rest/controller/video-upload.controller';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PersistenceModule.forRoot(),
    EventEmitterModule,
    LoggerModule,
    DynamoDBPersistenceModule,
    HttpClientModule,
  ],
  providers: [
    VideoResolver,
    ContentManagementService,
    ExternalMovieRatingClient,
    ContentManagementEventHandler,
    VideoProcessingService,
    ContentIndexingService,
    ContentProcessingEventHandler,
    ContentMediaRepository,
    MediaPlayerService,
  ],
  controllers: [VideoUploadController, MediaPlayerController],
})
export class ContentModule {}
