import { Module } from '@nestjs/common';
import { CreateMovieUseCase } from '@tlc/content/application/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from '@tlc/content/application/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from '@tlc/content/application/use-case/create-tv-show.use-case';
import { GetStreamingURLUseCase } from '@tlc/content/application/use-case/get-streaming-url.use-case';
import { ListContentUseCase } from '@tlc/content/application/use-case/list-content.use-case';
import { AgeRecommendationService } from '@tlc/content/core/service/age-recommendation.service';
import { ContentDistributionService } from '@tlc/content/core/service/content-distribution.service';
import { ContentIndexingService } from '@tlc/content/core/service/content-indexing.service';
import { EpisodeLifecycleService } from '@tlc/content/core/service/episode-lifecycle.service';
import { VideoMetadataService } from '@tlc/content/core/service/video-metadata.service';
import { VideoProcessingService } from '@tlc/content/core/service/video-processing.service';
import { VideoProcessorService } from '@tlc/content/core/service/video-processor.service';
import { VideoProfanityFilterService } from '@tlc/content/core/service/video-profanity-filter.service';
import { ContentManagementEventHandler } from '@tlc/content/event/handler/content-management.event-handler';
import { ContentProcessingEventHandler } from '@tlc/content/event/handler/content-processing.event-handler';
import { ExternalMovieRatingClient } from '@tlc/content/http/client/external-movie-rating/external-movie-rating.client';
import { AdminMovieController } from '@tlc/content/http/rest/controller/admin-movie.controller';
import { AdminTvShowController } from '@tlc/content/http/rest/controller/admin-tv-show.controller';
import { MediaPlayerController } from '@tlc/content/http/rest/controller/media-player.controller';
import { EventEmitterModule } from '@tlc/shared-module/event/event-emitter.module';
import { HttpClientModule } from '@tlc/shared-module/http-client/http-client.module';
import { LoggerModule } from '@tlc/shared-module/logger/logger.module';
import { VideoResolver } from './http/graphql/resolver/video.resolver';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [PersistenceModule, EventEmitterModule, LoggerModule, HttpClientModule],
  providers: [
    VideoResolver,
    ExternalMovieRatingClient,
    ContentManagementEventHandler,
    VideoProcessingService,
    ContentIndexingService,
    ContentProcessingEventHandler,
    VideoMetadataService,
    VideoProfanityFilterService,
    CreateTvShowEpisodeUseCase,
    AgeRecommendationService,
    ContentDistributionService,
    EpisodeLifecycleService,
    VideoProcessorService,
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateMovieUseCase,
    ListContentUseCase,
    GetStreamingURLUseCase,
    CreateTvShowUseCase,
  ],
  controllers: [AdminMovieController, AdminTvShowController, MediaPlayerController],
})
export class ContentModule {}
