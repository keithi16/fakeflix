import { Processor, WorkerHost } from '@nestjs/bullmq';
import { VideoNotFoundException } from '@tlc/content/shared/core/exception/video-not-found.exception';
import { QUEUES } from '@tlc/content/shared/queue/queue-constants';
import { TranscribeVideoUseCase } from '@tlc/content/video-processor/core/use-case/transcribe-video.use-case';
import { VideoRepository } from '@tlc/content/video-processor/persistence/repository/video.repository';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';
import { Job } from 'bullmq';

@Processor(QUEUES.VIDEO_TRANSCRIPT)
export class VideoTranscriptionConsumer extends WorkerHost {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly transcribeVideoUseCase: TranscribeVideoUseCase,
    private readonly logger: AppLogger
  ) {
    super();
  }
  async process(job: Job<{ videoId: string; url: string }, void>) {
    this.logger.log(`Processing transcript for video ID: ${job.data.videoId}`);

    const video = await this.videoRepository.findOneById(job.data.videoId, ['metadata']);
    if (!video) {
      throw new VideoNotFoundException(`Video with ID ${job.data.videoId} not found`);
    }

    await this.transcribeVideoUseCase.generateTranscript(video);
  }

  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed: ${job.id}`, {
      job,
      error,
    });
    //Do something with the error, log it, send a notification, put in a dead letter queue, etc.
  }
}
