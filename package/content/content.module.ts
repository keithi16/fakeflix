import { Module } from '@nestjs/common';
import { CreateMovieUseCase } from '@tlc/content/application/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from '@tlc/content/application/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from '@tlc/content/application/use-case/create-tv-show.use-case';
import { GetStreamingURLUseCase } from '@tlc/content/application/use-case/get-streaming-url.use-case';
import { ListContentUseCase } from '@tlc/content/application/use-case/list-content.use-case';
import { VideoAgeRecommendationAdapter } from '@tlc/content/core/adapter/video-recommendation.adapter.interface';
import { VideoSummaryGenerationAdapter } from '@tlc/content/core/adapter/video-summary-generator.adapter.interface';
import { VideoTranscriptGenerationAdapter } from '@tlc/content/core/adapter/video-transcript-generator.adapter.interface';
import { AgeRecommendationService } from '@tlc/content/core/service/age-recommendation.service';
import { ContentDistributionService } from '@tlc/content/core/service/content-distribution.service';
import { EpisodeLifecycleService } from '@tlc/content/core/service/episode-lifecycle.service';
import { VideoMetadataService } from '@tlc/content/core/service/video-metadata.service';
import { VideoProcessorService } from '@tlc/content/core/service/video-processor.service';
import { ExternalMovieRatingClient } from '@tlc/content/http/client/external-movie-rating/external-movie-rating.client';
import { GeminiTextExtractorClient } from '@tlc/content/http/client/gemini-api/gemini-text-extractor.client';
import { AdminMovieController } from '@tlc/content/http/rest/controller/admin-movie.controller';
import { AdminTvShowController } from '@tlc/content/http/rest/controller/admin-tv-show.controller';
import { MediaPlayerController } from '@tlc/content/http/rest/controller/media-player.controller';
import { HttpClientModule } from '@tlc/shared-module/http-client/http-client.module';
import { LoggerModule } from '@tlc/shared-module/logger/logger.module';
import { VideoResolver } from './http/graphql/resolver/video.resolver';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [PersistenceModule, LoggerModule, HttpClientModule],
  providers: [
    VideoResolver,
    ExternalMovieRatingClient,
    VideoMetadataService,
    CreateTvShowEpisodeUseCase,
    AgeRecommendationService,
    ContentDistributionService,
    EpisodeLifecycleService,
    VideoProcessorService,
    {
      provide: VideoSummaryGenerationAdapter,
      useClass: GeminiTextExtractorClient,
    },
    {
      provide: VideoTranscriptGenerationAdapter,
      useClass: GeminiTextExtractorClient,
    },
    {
      provide: VideoAgeRecommendationAdapter,
      useClass: GeminiTextExtractorClient,
    },
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateMovieUseCase,
    ListContentUseCase,
    GetStreamingURLUseCase,
    CreateTvShowUseCase,
    GeminiTextExtractorClient,
  ],
  controllers: [AdminMovieController, AdminTvShowController, MediaPlayerController],
})
export class ContentModule {}
