import { Injectable } from '@nestjs/common';
import { VideoMetadataService } from '@tlc/content/core/service/video-metadata.service';
import { Video } from '@tlc/content/persistence/entity/video.entity';
import { VideoProcessingJobProducer } from '@tlc/content/queue/producer/video-processing-job.queue-producer';

@Injectable()
export class VideoProcessorService {
  constructor(
    private readonly videoProcessingJobProducer: VideoProcessingJobProducer,
    private readonly videoMetadataService: VideoMetadataService
  ) {}

  async processMetadataAndModeration(video: Video) {
    //Triggers the async processing of video metadata and moderation
    return Promise.all([
      this.videoProcessingJobProducer.processRecommendation(video),
      this.videoProcessingJobProducer.processTranscript(video),
      this.videoProcessingJobProducer.processSummary(video),
      this.videoMetadataService.setVideoDuration(video),
    ]);
  }
}
