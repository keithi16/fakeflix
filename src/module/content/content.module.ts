import { Module } from '@nestjs/common';
import { AgeRecommendationService } from '@src/module/content/core/service/age-recommendation.service';
import { ContentDistributionService } from '@src/module/content/core/service/content-distribution.service';
import { ContentIndexingService } from '@src/module/content/core/service/content-indexing.service';
import { MediaPlayerService } from '@src/module/content/core/service/media-player.service';
import { VideoMetadataService } from '@src/module/content/core/service/video-metadata.service';
import { VideoProcessingService } from '@src/module/content/core/service/video-processing.service';
import { VideoProfanityFilterService } from '@src/module/content/core/service/video-profanity-filter.service';
import { ContentManagementEventHandler } from '@src/module/content/event/handler/content-management.event-handler';
import { ContentProcessingEventHandler } from '@src/module/content/event/handler/content-processing.event-handler';
import { ExternalMovieRatingClient } from '@src/module/content/http/client/external-movie-rating/external-movie-rating.client';
import { AdminMovieController } from '@src/module/content/http/rest/controller/admin-movie.controller';
import { AdminTvShowController } from '@src/module/content/http/rest/controller/admin-tv-show.controller';
import { MediaPlayerController } from '@src/module/content/http/rest/controller/media-player.controller';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { EventEmitterModule } from '@src/shared/module/event/event-emitter.module';
import { HttpClientModule } from '@src/shared/module/http-client/http-client.module';
import { LoggerModule } from '@src/shared/module/logger/logger.module';
import { ContentManagementService } from './core/service/content-management.service';
import { VideoResolver } from './http/graphql/resolver/video.resolver';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PersistenceModule.forRoot(),
    EventEmitterModule,
    LoggerModule,
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
    MediaPlayerService,
    AgeRecommendationService,
    VideoMetadataService,
    ContentDistributionService,
    VideoProfanityFilterService,
  ],
  controllers: [AdminMovieController, AdminTvShowController, MediaPlayerController],
})
export class ContentModule {}
