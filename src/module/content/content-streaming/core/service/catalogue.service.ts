import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/content/content-streaming/core/entity/video.entity';
import { VideoRepository } from '@src/module/content/content-streaming/persistence/repository/video.repository';

@Injectable()
export class CatalogueService {
  constructor(private readonly videoRepository: VideoRepository) {}
  async listVideos(): Promise<VideoEntity[]> {
    return this.videoRepository.findAll();
  }
  async getVideoInfo(id: string): Promise<VideoEntity | null> {
    return this.videoRepository.findOne({ id });
  }
}
