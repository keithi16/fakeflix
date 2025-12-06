import { Module } from '@nestjs/common';
import { HttpClientModule } from '@tlc/shared-module/http-client';
import { LoggerModule } from '@tlc/shared-module/logger';
import { ContentSharedModule } from '../shared/content-shared.module';
import { ContentSharedPersistenceModule } from '../shared/persistence/persistence.module';
// Transcription feature
import { VideoTranscriptGenerationAdapter } from './transcription/core/adapter/video-transcript-generator.adapter.interface';
import { TranscribeVideoUseCase } from './transcription/core/use-case/transcribe-video.use-case';
import { VideoTranscriptionConsumer } from './transcription/queue/consumer/video-transcription.queue-consumer';
// Summary feature
import { VideoSummaryGenerationAdapter } from './summary/core/adapter/video-summary-generator.adapter.interface';
import { GenerateSummaryForVideoUseCase } from './summary/core/use-case/generate-summary-for-video.use-case';
import { VideoSummaryConsumer } from './summary/queue/consumer/video-summary.queue-consumer';
// Age recommendation feature
import { VideoAgeRecommendationAdapter } from './age-recommendation/core/adapter/video-recommendation.adapter.interface';
import { SetAgeRecommendationUseCase } from './age-recommendation/core/use-case/set-age-recommendation.use-case';
import { VideoAgeRecommendationConsumer } from './age-recommendation/queue/consumer/video-age-recommendation.queue-consumer';
import { ContentAgeRecommendationQueueProducer } from './age-recommendation/queue/producer/content-age-recommendation.queue-producer';
// Shared processor infrastructure
import { GeminiTextExtractorClient } from './shared/http/client/gemini-api/gemini-text-extractor.client';

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
