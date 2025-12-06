import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { AppLogger } from '@tlc/shared-module/logger';
import { Job } from 'bullmq';
import { QUEUES } from '../../../../shared/queue/queue-constants';
import { SetAgeRecommendationForContentUseCase } from '../../core/use-case/set-age-recommendation-for-content.use-case';

@Processor(QUEUES.CONTENT_AGE_RECOMMENDATION)
export class ContentAgeRecommendationConsumer extends WorkerHost {
  constructor(
    private readonly setAgeRecommendationUseCase: SetAgeRecommendationForContentUseCase,
    private readonly logger: AppLogger
  ) {
    super();
  }
  async process(job: Job<{ videoId: string; ageRecommendation: number }, void>) {
    this.logger.log(`Processing age recommendation for video ${job.data.videoId}`);

    try {
      await this.setAgeRecommendationUseCase.execute(
        job.data.videoId,
        job.data.ageRecommendation
      );
    } catch (error) {
      this.logger.error(
        `Error processing age recommendation for content with videoId ${job.data.videoId}`,
        {
          error,
          videoId: job.data.videoId,
        }
      );
      throw new Error(
        `Failed to process age recommendation for content with videoId ${job.data.videoId}`
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed: ${job.id}`, {
      job,
      error,
    });
    //Do something with the error, log it, send a notification, put in a dead letter queue, etc.
  }
}
