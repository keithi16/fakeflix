import { Module } from '@nestjs/common';
import { ContentAgeRecommendationService } from '@tlc/content/admin/core/service/content-age-recommendation.service';
import { ContentDistributionService } from '@tlc/content/admin/core/service/content-distribution.service';
import { EpisodeLifecycleService } from '@tlc/content/admin/core/service/episode-lifecycle.service';
import { VideoProcessorService } from '@tlc/content/admin/core/service/video-processor.service';
import { CreateMovieUseCase } from '@tlc/content/admin/core/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from '@tlc/content/admin/core/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from '@tlc/content/admin/core/use-case/create-tv-show.use-case';
import { SetAgeRecommendationForContentUseCase } from '@tlc/content/admin/core/use-case/set-age-recommendation-for-content.user-case';
import { ExternalMovieRatingClient } from '@tlc/content/admin/http/client/external-movie-rating/external-movie-rating.client';
import { AdminMovieController } from '@tlc/content/admin/http/rest/controller/admin-movie.controller';
import { AdminTvShowController } from '@tlc/content/admin/http/rest/controller/admin-tv-show.controller';
import { VideoProcessingJobProducer } from '@tlc/content/admin/queue/producer/video-processing-job.queue-producer';
import { ContentSharedModule } from '@tlc/content/shared/content-shared.module';
import { HttpClientModule } from '@tlc/shared-module/http-client/http-client.module';
import { LoggerModule } from '@tlc/shared-module/logger/logger.module';

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
