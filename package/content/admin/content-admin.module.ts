import { Module } from '@nestjs/common';
import { HttpClientModule } from '@tlc/shared-module/http-client';
import { LoggerModule } from '@tlc/shared-module/logger';
import { ContentSharedModule } from '../shared/content-shared.module';
import { ContentAgeRecommendationService } from './core/service/content-age-recommendation.service';
import { ContentDistributionService } from './core/service/content-distribution.service';
import { EpisodeLifecycleService } from './core/service/episode-lifecycle.service';
import { VideoProcessorService } from './core/service/video-processor.service';
import { CreateMovieUseCase } from './core/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from './core/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from './core/use-case/create-tv-show.use-case';
import { SetAgeRecommendationForContentUseCase } from './core/use-case/set-age-recommendation-for-content.user-case';
import { ExternalMovieRatingClient } from './http/client/external-movie-rating/external-movie-rating.client';
import { AdminMovieController } from './http/rest/controller/admin-movie.controller';
import { AdminTvShowController } from './http/rest/controller/admin-tv-show.controller';
import { VideoProcessingJobProducer } from './queue/producer/video-processing-job.queue-producer';

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
