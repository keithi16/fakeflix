import { Injectable } from '@nestjs/common';
import { VideoProcessingJobProducer } from '../../queue/producer/video-processing-job.queue-producer';
import { Video } from '../../../shared/persistence/entity/video.entity';

@Injectable()
export class VideoProcessorService {
  constructor(private readonly videoProcessingJobProducer: VideoProcessingJobProducer) {}

  async processMetadataAndModeration(video: Video): Promise<void> {
    //Triggers the async processing of video metadata and moderation
    await Promise.all([
      this.videoProcessingJobProducer.processRecommendation(video),
      this.videoProcessingJobProducer.processTranscript(video),
      this.videoProcessingJobProducer.processSummary(video),
    ]);
  }
}
