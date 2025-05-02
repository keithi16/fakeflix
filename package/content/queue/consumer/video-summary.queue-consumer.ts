import { Processor, WorkerHost } from '@nestjs/bullmq';
import { GenerateSummaryForVideoUseCase } from '@tlc/content/application/use-case/generate-summary-for-video.use-case';
import { VideoNotFoundException } from '@tlc/content/core/exception/video-not-found.exception';
import { VideoRepository } from '@tlc/content/persistence/repository/video.repository';
import { QUEUES } from '@tlc/content/queue/queue-constants';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';
import { Job } from 'bullmq';

@Processor(QUEUES.VIDEO_SUMMARY)
export class VideoSummaryConsumer extends WorkerHost {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly generateSummaryForVideoUseCase: GenerateSummaryForVideoUseCase,
    private readonly logger: AppLogger
  ) {
    super();
  }
  async process(job: Job<{ videoId: string; url: string }, void>) {
    this.logger.log(`Processing summary for video ID: ${job.data.videoId}`);

    try {
      const video = await this.videoRepository.findOneById(job.data.videoId, [
        'metadata',
      ]);
      if (!video) {
        throw new VideoNotFoundException(`Video with ID ${job.data.videoId} not found`);
      }

      await this.generateSummaryForVideoUseCase.generateSummary(video);
    } catch (error) {
      this.logger.error('Error processing summary:', {
        error,
        videoId: job.data.videoId,
      });
      throw new Error(`Failed to process summary for video ID ${job.data.videoId}`);
    }
  }

  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed: ${job.id}`, {
      job,
      error,
    });
    //Do something with the error, log it, send a notification, put in a dead letter queue, etc.
  }
}
