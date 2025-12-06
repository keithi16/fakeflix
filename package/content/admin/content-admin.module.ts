import { Module } from '@nestjs/common';
import { HttpClientModule } from '@tlc/shared-module/http-client';
import { LoggerModule } from '@tlc/shared-module/logger';
import { ContentSharedModule } from '../shared/content-shared.module';
// Movie feature
import { CreateMovieUseCase } from './movie/core/use-case/create-movie.use-case';
import { ExternalMovieRatingClient } from './movie/http/client/external-movie-rating/external-movie-rating.client';
import { AdminMovieController } from './movie/http/rest/controller/admin-movie.controller';
// TV Show feature
import { CreateTvShowEpisodeUseCase } from './tv-show/core/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from './tv-show/core/use-case/create-tv-show.use-case';
import { EpisodeLifecycleService } from './tv-show/core/service/episode-lifecycle.service';
import { AdminTvShowController } from './tv-show/http/rest/controller/admin-tv-show.controller';
// Age Recommendation feature
import { ContentAgeRecommendationService } from './age-recommendation/core/service/content-age-recommendation.service';
import { SetAgeRecommendationForContentUseCase } from './age-recommendation/core/use-case/set-age-recommendation-for-content.use-case';
// Shared admin infrastructure
import { ContentDistributionService } from './shared/core/service/content-distribution.service';
import { VideoProcessorService } from './shared/core/service/video-processor.service';
import { VideoProcessingJobProducer } from './shared/queue/producer/video-processing-job.queue-producer';

@Module({
  imports: [ContentSharedModule, LoggerModule, HttpClientModule],
  providers: [
    ExternalMovieRatingClient,
    CreateTvShowEpisodeUseCase,
    ContentAgeRecommendationService,
    ContentDistributionService,
    EpisodeLifecycleService,
    VideoProcessorService,
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateMovieUseCase,
    CreateTvShowUseCase,
    VideoProcessingJobProducer,
    SetAgeRecommendationForContentUseCase,
  ],
  controllers: [AdminMovieController, AdminTvShowController],
})
export class ContentAdminModule {}
