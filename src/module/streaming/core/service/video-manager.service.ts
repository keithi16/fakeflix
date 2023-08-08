import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/streaming/core/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/storage/repository/video.repository';

@Injectable()
export class VideoManagerService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async create(video: VideoEntity): Promise<VideoEntity> {
    return this.videoRepository.save(video);
  }
}
