import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { VideoMetadata } from '@tlc/content/shared/persistence/entity/video-metadata.entity';
import { QUEUES } from '@tlc/content/shared/queue/queue-constants';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';
import { Queue } from 'bullmq';

@Injectable()
export class ContentAgeRecommendationQueueProducer {
  constructor(
    @InjectQueue(QUEUES.CONTENT_AGE_RECOMMENDATION)
    private contentAgeRecommendationQueue: Queue,
    private readonly logger: AppLogger
  ) {}

  private cratePayload(videoMetadata: VideoMetadata) {
    return {
      videoId: videoMetadata.videoId,
      ageRecommendation: videoMetadata.ageRating,
    };
  }

  async processContentAgeRecommendation(videoMetadata: VideoMetadata) {
    this.logger.log(
      `Queueing content recommendation processing job for video ID: ${videoMetadata.videoId}`
    );

    const job = await this.contentAgeRecommendationQueue.add(
      'process',
      this.cratePayload(videoMetadata)
    );

    this.logger.log(
      `Content recommendation processing job created with ID: ${job.id} for video ID: ${videoMetadata.id}`
    );
    return job.id;
  }
}
