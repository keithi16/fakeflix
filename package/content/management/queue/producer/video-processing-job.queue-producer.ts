import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Queue } from 'bullmq';
import { VideoProcessingJobPayload } from '../../../shared/contract/video-processing-job.contract';
import { QUEUES } from '../../../shared/queue/queue-constants';

@Injectable()
export class VideoProcessingJobProducer {
  constructor(
    @InjectQueue(QUEUES.VIDEO_AGE_RECOMMENDATION)
    private videoRecommendationQueue: Queue<VideoProcessingJobPayload>,
    @InjectQueue(QUEUES.VIDEO_TRANSCRIPT)
    private videoTranscriptQueue: Queue<VideoProcessingJobPayload>,
    @InjectQueue(QUEUES.VIDEO_SUMMARY)
    private videoSummaryQueue: Queue<VideoProcessingJobPayload>,
    private readonly logger: AppLogger
  ) {}

  private createVideoProcessingJob(videoId: string, url: string): VideoProcessingJobPayload {
    return { videoId, url };
  }

  async processRecommendation(videoId: string, url: string) {
    this.logger.log(
      `Queueing video recommendation processing job for video ID: ${videoId}`
    );

    const job = await this.videoRecommendationQueue.add(
      'process',
      this.createVideoProcessingJob(videoId, url)
    );

    this.logger.log(
      `Video recommendation processing job created with ID: ${job.id} for video ID: ${videoId}`
    );
    return job.id;
  }

  async processTranscript(videoId: string, url: string) {
    this.logger.log(`Queueing video transcript processing job for video ID: ${videoId}`);

    const job = await this.videoTranscriptQueue.add(
      'process',
      this.createVideoProcessingJob(videoId, url)
    );

    this.logger.log(
      `Video transcript processing job created with ID: ${job.id} for video ID: ${videoId}`
    );
    return job.id;
  }

  async processSummary(videoId: string, url: string) {
    this.logger.log(`Queueing video summary processing job for video ID: ${videoId}`);

    const job = await this.videoSummaryQueue.add(
      'process',
      this.createVideoProcessingJob(videoId, url)
    );

    this.logger.log(
      `Video summary processing job created with ID: ${job.id} for video ID: ${videoId}`
    );
    return job.id;
  }
}
