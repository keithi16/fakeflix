import { Module } from '@nestjs/common';
import { ContentSharedModule } from '@tlc/content/shared/content-shared.module';
import { ContentSharedPersistenceModule } from '@tlc/content/shared/persistence/persistence.module';
import { VideoAgeRecommendationAdapter } from '@tlc/content/video-processor/core/adapter/video-recommendation.adapter.interface';
import { VideoSummaryGenerationAdapter } from '@tlc/content/video-processor/core/adapter/video-summary-generator.adapter.interface';
import { VideoTranscriptGenerationAdapter } from '@tlc/content/video-processor/core/adapter/video-transcript-generator.adapter.interface';
import { GenerateSummaryForVideoUseCase } from '@tlc/content/video-processor/core/use-case/generate-summary-for-video.use-case';
import { SetAgeRecommendationUseCase } from '@tlc/content/video-processor/core/use-case/set-age-recommendation.use-case';
import { TranscribeVideoUseCase } from '@tlc/content/video-processor/core/use-case/transcribe-video.use-case';
import { GeminiTextExtractorClient } from '@tlc/content/video-processor/http/client/gemini-api/gemini-text-extractor.client';
import { VideoAgeRecommendationConsumer } from '@tlc/content/video-processor/queue/consumer/video-age-recommendation.queue-consumer';
import { VideoSummaryConsumer } from '@tlc/content/video-processor/queue/consumer/video-summary.queue-consumer';
import { VideoTranscriptionConsumer } from '@tlc/content/video-processor/queue/consumer/video-transcription.queue-consumer';
import { ContentAgeRecommendationQueueProducer } from '@tlc/content/video-processor/queue/producer/content-age-recommendation.queue-producer';
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
