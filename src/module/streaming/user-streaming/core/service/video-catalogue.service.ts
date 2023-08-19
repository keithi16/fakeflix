import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/streaming/shared/core/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/shared/storage/repository/video.repository';

@Injectable()
export class VideoCatalogueService {
  constructor(protected readonly videoRepository: VideoRepository) {}
  async list(): Promise<VideoEntity[]> {
    return this.videoRepository.findAll();
  }
  async getVideoInfo(id: string): Promise<VideoEntity | null> {
    return this.videoRepository.findOne(id);
  }
}
