import { Module } from '@nestjs/common';
import { ContentSharedModule } from '../shared/content-shared.module';
import { ContentSharedPersistenceModule } from '../shared/persistence/persistence.module';
import { VideoAgeRecommendationAdapter } from './core/adapter/video-recommendation.adapter.interface';
import { VideoSummaryGenerationAdapter } from './core/adapter/video-summary-generator.adapter.interface';
import { VideoTranscriptGenerationAdapter } from './core/adapter/video-transcript-generator.adapter.interface';
import { GenerateSummaryForVideoUseCase } from './core/use-case/generate-summary-for-video.use-case';
import { SetAgeRecommendationUseCase } from './core/use-case/set-age-recommendation.use-case';
import { TranscribeVideoUseCase } from './core/use-case/transcribe-video.use-case';
import { GeminiTextExtractorClient } from './http/client/gemini-api/gemini-text-extractor.client';
import { VideoAgeRecommendationConsumer } from './queue/consumer/video-age-recommendation.queue-consumer';
import { VideoSummaryConsumer } from './queue/consumer/video-summary.queue-consumer';
import { VideoTranscriptionConsumer } from './queue/consumer/video-transcription.queue-consumer';
import { ContentAgeRecommendationQueueProducer } from './queue/producer/content-age-recommendation.queue-producer';
import { HttpClientModule } from '@tlc/shared-module/http-client/http-client.module';
import { LoggerModule } from '@tlc/shared-module/logger/logger.module';

@Module({
  imports: [
    ContentSharedPersistenceModule,
    LoggerModule,
    HttpClientModule,
    ContentSharedModule,
  ],
  providers: [
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
    VideoAgeRecommendationConsumer,
    VideoSummaryConsumer,
    VideoTranscriptionConsumer,
    GenerateSummaryForVideoUseCase,
    SetAgeRecommendationUseCase,
    TranscribeVideoUseCase,
    ContentAgeRecommendationQueueProducer,
  ],
})
export class ContentVideoProcessorModule {}
