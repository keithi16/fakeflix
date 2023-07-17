import { Inject, Injectable } from '@nestjs/common';
import { NewVideo, Video } from '@src/module/streaming/domain/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/domain/repository/video.repository.interface';

@Injectable()
export class VideoUploadService {
  constructor(
    @Inject(VideoRepository) private readonly videoRepository: VideoRepository
  ) {}

  async uploadVideo(video: NewVideo): Promise<Video> {
    return await this.videoRepository.create(video);
  }
}
