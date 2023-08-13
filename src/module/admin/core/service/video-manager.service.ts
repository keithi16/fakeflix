import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/admin/core/entity/video.entity';
import { VideoRepository } from '@src/module/admin/storage/repository/video.repository';

@Injectable()
export class VideoManagerService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async create(video: VideoEntity): Promise<VideoEntity> {
    return this.videoRepository.save(video);
  }
}
