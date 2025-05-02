import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CreateMovieUseCase } from '@tlc/content/application/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from '@tlc/content/application/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from '@tlc/content/application/use-case/create-tv-show.use-case';
import { GenerateSummaryForVideoUseCase } from '@tlc/content/application/use-case/generate-summary-for-video.use-case';
import { GetStreamingURLUseCase } from '@tlc/content/application/use-case/get-streaming-url.use-case';
import { ListContentUseCase } from '@tlc/content/application/use-case/list-content.use-case';
import { SetAgeRecommendationUseCase } from '@tlc/content/application/use-case/set-age-recommendation.use-case';
import { TranscribeVideoUseCase } from '@tlc/content/application/use-case/transcribe-video.use-case';
import { ContentConfig } from '@tlc/content/config';
import { VideoAgeRecommendationAdapter } from '@tlc/content/core/adapter/video-recommendation.adapter.interface';
import { VideoSummaryGenerationAdapter } from '@tlc/content/core/adapter/video-summary-generator.adapter.interface';
import { VideoTranscriptGenerationAdapter } from '@tlc/content/core/adapter/video-transcript-generator.adapter.interface';
import { ContentAgeRecommendationService } from '@tlc/content/core/service/content-age-recommendation.service';
import { ContentDistributionService } from '@tlc/content/core/service/content-distribution.service';
import { EpisodeLifecycleService } from '@tlc/content/core/service/episode-lifecycle.service';
import { VideoMetadataService } from '@tlc/content/core/service/video-metadata.service';
import { VideoProcessorService } from '@tlc/content/core/service/video-processor.service';
import { ExternalMovieRatingClient } from '@tlc/content/http/client/external-movie-rating/external-movie-rating.client';
import { GeminiTextExtractorClient } from '@tlc/content/http/client/gemini-api/gemini-text-extractor.client';
import { AdminMovieController } from '@tlc/content/http/rest/controller/admin-movie.controller';
import { AdminTvShowController } from '@tlc/content/http/rest/controller/admin-tv-show.controller';
import { MediaPlayerController } from '@tlc/content/http/rest/controller/media-player.controller';
import { VideoAgeRecommendationConsumer } from '@tlc/content/queue/consumer/video-age-recommendation.queue-consumer';
import { VideoSummaryConsumer } from '@tlc/content/queue/consumer/video-summary.queue-consumer';
import { VideoTranscriptionConsumer } from '@tlc/content/queue/consumer/video-transcription.queue-consumer';
import { VideoProcessingJobProducer } from '@tlc/content/queue/producer/video-processing-job.queue-producer';
import { QUEUES } from '@tlc/content/queue/queue-constants';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { HttpClientModule } from '@tlc/shared-module/http-client/http-client.module';
import { LoggerModule } from '@tlc/shared-module/logger/logger.module';
import { VideoResolver } from './http/graphql/resolver/video.resolver';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [
    PersistenceModule,
    LoggerModule,
    HttpClientModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<ContentConfig>) => ({
        connection: {
          host: configService.get('content.redis.host'),
          port: configService.get('content.redis.port'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUES.VIDEO_AGE_RECOMMENDATION,
      },
      {
        name: QUEUES.VIDEO_SUMMARY,
      },
      {
        name: QUEUES.VIDEO_TRANSCRIPT,
      }
    ),
  ],
  providers: [
    VideoResolver,
    ExternalMovieRatingClient,
    VideoMetadataService,
    CreateTvShowEpisodeUseCase,
    ContentAgeRecommendationService,
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
    TranscribeVideoUseCase,
    VideoSummaryConsumer,
    VideoAgeRecommendationConsumer,
    VideoTranscriptionConsumer,
    VideoProcessingJobProducer,
    SetAgeRecommendationUseCase,
    GenerateSummaryForVideoUseCase,
    TranscribeVideoUseCase,
  ],
  controllers: [AdminMovieController, AdminTvShowController, MediaPlayerController],
})
export class ContentModule {}
