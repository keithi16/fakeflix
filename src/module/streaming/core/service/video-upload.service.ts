import { Injectable } from '@nestjs/common';
import { NewVideo, Video } from '@src/module/streaming/core/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/storage/repository/video.repository';

@Injectable()
export class VideoUploadService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async uploadVideo(video: NewVideo): Promise<Video> {
    return await this.videoRepository.create(video);
  }
}
