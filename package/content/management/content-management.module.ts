import { Module } from '@nestjs/common';
import { HttpClientModule } from '@tlc/shared-module/http-client';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AuthModule } from '@tlc/shared-module/auth';
import { ClsModule } from 'nestjs-cls';
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
import { TransitionContentUseCase } from './core/use-case/transition-content.use-case';
import { ListAdminContentUseCase } from './core/use-case/list-admin-content.use-case';
import { GetAdminContentUseCase } from './core/use-case/get-admin-content.use-case';
import { ContentPublishingStateMachineService } from './core/service/content-publishing-state-machine.service';
import { PublicationQualityGateService } from './core/service/publication-quality-gate.service';
import { ExternalMovieRatingClient } from './http/client/external-movie-rating/external-movie-rating.client';
import { ManagementMovieController } from './http/rest/controller/management-movie.controller';
import { ManagementTvShowController } from './http/rest/controller/management-tv-show.controller';
import { ContentLifecycleController } from './http/rest/controller/content-lifecycle.controller';
import { PipelineDashboardController } from './http/rest/controller/pipeline-dashboard.controller';
import { PipelineSummaryUseCase } from './core/use-case/pipeline-summary.use-case';
import { ListRecentTransitionsUseCase } from './core/use-case/list-recent-transitions.use-case';
import { ListContentTransitionsUseCase } from './core/use-case/list-content-transitions.use-case';
import { BulkTransitionContentUseCase } from './core/use-case/bulk-transition-content.use-case';
import { CancelScheduledPublishUseCase } from './core/use-case/cancel-scheduled-publish.use-case';
import { ContentRepository } from './persistence/repository/content.repository';
import { EpisodeRepository } from './persistence/repository/episode.repository';
import { ContentTransitionRepository } from './persistence/repository/content-transition.repository';
import { ContentAgeRecommendationConsumer } from './queue/consumer/content-age-recommendation.queue-consumer';
import { ScheduledPublishConsumer } from './queue/consumer/scheduled-publish.queue-consumer';
import { VideoProcessingJobProducer } from './queue/producer/video-processing-job.queue-producer';
import { ScheduledPublishProducer } from './queue/producer/scheduled-publish.queue-producer';

@Module({
  imports: [
    ContentSharedModule,
    ContentMediaModule,
    LoggerModule,
    HttpClientModule,
    AuthModule,
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
  ],
  providers: [
    ContentRepository,
    EpisodeRepository,
    ContentTransitionRepository,
    { provide: ExternalMovieRatingAdapter, useClass: ExternalMovieRatingClient },
    ContentAgeRecommendationService,
    ContentDistributionService,
    EpisodeLifecycleService,
    VideoProcessorService,
    ContentPublishingStateMachineService,
    PublicationQualityGateService,
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateTvShowUseCase,
    VideoProcessingJobProducer,
    ScheduledPublishProducer,
    SetAgeRecommendationForContentUseCase,
    ContentAgeRecommendationConsumer,
    ScheduledPublishConsumer,
    TransitionContentUseCase,
    ListAdminContentUseCase,
    GetAdminContentUseCase,
    PipelineSummaryUseCase,
    ListRecentTransitionsUseCase,
    ListContentTransitionsUseCase,
    BulkTransitionContentUseCase,
    CancelScheduledPublishUseCase,
  ],
  controllers: [ManagementMovieController, ManagementTvShowController, ContentLifecycleController, PipelineDashboardController],
  exports: [],
})
export class ContentManagementModule {}
