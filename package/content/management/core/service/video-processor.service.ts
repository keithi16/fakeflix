import { Injectable } from '@nestjs/common';
import { VideoProcessingJobProducer } from '../../queue/producer/video-processing-job.queue-producer';

@Injectable()
export class VideoProcessorService {
  constructor(private readonly videoProcessingJobProducer: VideoProcessingJobProducer) {}

  async processMetadataAndModeration(videoId: string, videoUrl: string): Promise<void> {
    await Promise.all([
      this.videoProcessingJobProducer.processRecommendation(videoId, videoUrl),
      this.videoProcessingJobProducer.processTranscript(videoId, videoUrl),
      this.videoProcessingJobProducer.processSummary(videoId, videoUrl),
    ]);
  }
}
