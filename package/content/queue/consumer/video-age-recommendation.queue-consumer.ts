import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { SetAgeRecommendationUseCase } from '@tlc/content/application/use-case/set-age-recommendation.use-case';
import { VideoNotFoundException } from '@tlc/content/core/exception/video-not-found.exception';
import { VideoRepository } from '@tlc/content/persistence/repository/video.repository';
import { QUEUES } from '@tlc/content/queue/queue-constants';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';
import { Job } from 'bullmq';

@Processor(QUEUES.VIDEO_AGE_RECOMMENDATION)
export class VideoAgeRecommendationConsumer extends WorkerHost {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly setAgeRecommendationUseCase: SetAgeRecommendationUseCase,
    private readonly logger: AppLogger
  ) {
    super();
  }
  async process(job: Job<{ videoId: string; url: string }, void>) {
    this.logger.log(`Processing age recommendation for video ${job.data.videoId}`);

    const video = await this.videoRepository.findOneById(job.data.videoId);
    if (!video) {
      throw new VideoNotFoundException(`Video with ID ${job.data.videoId} not found`);
    }

    try {
      await this.setAgeRecommendationUseCase.setAgeRecommendation(video);
    } catch (error) {
      this.logger.error(`Error processing age recommendation for video ${video.id}`, {
        error,
        videoId: video.id,
      });
      throw new Error(`Failed to process age recommendation for video ID ${video.id}`);
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
