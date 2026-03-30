import { Module } from '@nestjs/common';
import { HttpClientModule } from '@tlc/shared-module/http-client';
import { LoggerModule } from '@tlc/shared-module/logger';
import { ContentCatalogApi } from '@tlc/shared-module/public-api';
import { ContentCatalogFacade } from './public-api/facade/content-catalog.facade';
import { ListCatalogContentUseCase } from './core/use-case/list-catalog-content.use-case';
import { ContentSharedModule } from '../shared/content-shared.module';
import { ContentMediaModule } from '../media/content-media.module';
import { ContentAgeRecommendationService } from './core/service/content-age-recommendation.service';
import { ContentDistributionService } from './core/service/content-distribution.service';
import { EpisodeLifecycleService } from './core/service/episode-lifecycle.service';
import { VideoProcessorService } from './core/service/video-processor.service';
import { ExternalMovieRatingAdapter } from './core/adapter/external-movie-rating.adapter.interface';
import { CreateMovieUseCase } from './core/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from './core/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from './core/use-case/create-tv-show.use-case';
import { SetAgeRecommendationForContentUseCase } from './core/use-case/set-age-recommendation-for-content.user-case';
import { ExternalMovieRatingClient } from './http/client/external-movie-rating/external-movie-rating.client';
import { ManagementMovieController } from './http/rest/controller/management-movie.controller';
import { ManagementTvShowController } from './http/rest/controller/management-tv-show.controller';
import { ContentRepository } from './persistence/repository/content.repository';
import { EpisodeRepository } from './persistence/repository/episode.repository';
import { ContentAgeRecommendationConsumer } from './queue/consumer/content-age-recommendation.queue-consumer';
import { VideoProcessingJobProducer } from './queue/producer/video-processing-job.queue-producer';

@Module({
  imports: [ContentSharedModule, ContentMediaModule, LoggerModule, HttpClientModule],
  providers: [
    ContentRepository,
    EpisodeRepository,
    { provide: ExternalMovieRatingAdapter, useClass: ExternalMovieRatingClient },
    ContentAgeRecommendationService,
    ContentDistributionService,
    EpisodeLifecycleService,
    VideoProcessorService,
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateTvShowUseCase,
    VideoProcessingJobProducer,
    SetAgeRecommendationForContentUseCase,
    ContentAgeRecommendationConsumer,
    ListCatalogContentUseCase,
    ContentCatalogFacade,
    { provide: ContentCatalogApi, useClass: ContentCatalogFacade },
  ],
  controllers: [ManagementMovieController, ManagementTvShowController],
  exports: [ContentCatalogApi],
})
export class ContentManagementModule {}
