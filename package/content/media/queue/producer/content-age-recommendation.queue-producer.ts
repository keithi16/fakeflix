import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Queue } from 'bullmq';
import { ContentAgeRecommendationJobPayload } from '../../../shared/contract/content-age-recommendation-job.contract';
import { VideoMetadata } from '../../persistence/entity/video-metadata.entity';
import { QUEUES } from '../../../shared/queue/queue-constants';

@Injectable()
export class ContentAgeRecommendationQueueProducer {
  constructor(
    @InjectQueue(QUEUES.CONTENT_AGE_RECOMMENDATION)
    private contentAgeRecommendationQueue: Queue<ContentAgeRecommendationJobPayload>,
    private readonly logger: AppLogger
  ) {}

  private cratePayload(
    videoMetadata: VideoMetadata
  ): ContentAgeRecommendationJobPayload {
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
