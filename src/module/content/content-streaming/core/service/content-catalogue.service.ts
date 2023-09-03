import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { VideoRepository } from '@src/module/content/shared/storage/repository/video.repository';

@Injectable()
export class ContentCatalogueService {
  constructor(protected readonly videoRepository: VideoRepository) {}
  async listVideos(): Promise<VideoEntity[]> {
    return this.videoRepository.findAll();
  }
  async getVideoInfo(id: string): Promise<VideoEntity | null> {
    return this.videoRepository.findOne(id);
  }
}
