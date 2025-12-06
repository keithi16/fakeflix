import { Inject, Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { VideoMetadata } from '../../../../shared/persistence/entity/video-metadata.entity';
import { Video } from '../../../../shared/persistence/entity/video.entity';
import { VideoMetadataRepository } from '../../../shared/persistence/repository/video-metadata.repository';
import { VideoTranscriptGenerationAdapter } from '../adapter/video-transcript-generator.adapter.interface';

@Injectable()
export class TranscribeVideoUseCase {
  constructor(
    @Inject(VideoTranscriptGenerationAdapter)
    private readonly videoTranscriptionGenerator: VideoTranscriptGenerationAdapter,
    private readonly videoMetadataRepository: VideoMetadataRepository,
    private readonly logger: AppLogger
  ) {}

  public async generateTranscript(video: Video): Promise<void> {
    const transcript = await this.videoTranscriptionGenerator.generateTranscript(
      video.url
    );
    if (!transcript) {
      throw new Error(`Failed to generate transcript for video with ID ${video.id}`);
    }
    this.logger.log(`Generated transcript for video ID ${video.id}`, {
      transcript,
      videoId: video.id,
    });

    const metadata = await this.videoMetadataRepository.findOne({
      where: { video },
    });

    if (metadata) {
      metadata.transcript = transcript;
      await this.videoMetadataRepository.save(metadata);
      return;
    }

    const newMetadata = new VideoMetadata({
      transcript,
      video,
    });

    await this.videoMetadataRepository.save(newMetadata);
  }
}
