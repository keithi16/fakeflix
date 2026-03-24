import { Processor, WorkerHost } from '@nestjs/bullmq';
import { AppLogger } from '@tlc/shared-module/logger';
import { Job } from 'bullmq';
import { VideoNotFoundException } from '../../../shared/core/exception/video-not-found.exception';
import { VideoProcessingJobPayload } from '../../../shared/contract/video-processing-job.contract';
import { QUEUES } from '../../../shared/queue/queue-constants';
import { TranscribeVideoUseCase } from '../../core/use-case/transcribe-video.use-case';
import { VideoRepository } from '../../persistence/repository/video.repository';

@Processor(QUEUES.VIDEO_TRANSCRIPT)
export class VideoTranscriptionConsumer extends WorkerHost {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly transcribeVideoUseCase: TranscribeVideoUseCase,
    private readonly logger: AppLogger
  ) {
    super();
  }
  async process(job: Job<VideoProcessingJobPayload, void>) {
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
