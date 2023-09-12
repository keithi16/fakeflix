import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/content/content-management/core/entity/video.entity';
import { VideoRepository } from '@src/module/content/content-management/persistence/repository/video.repository';
import {
  NewVideoEntity,
  VideoEntityProps,
} from '@src/module/content/shared/core/entity/default-video.entity';

export type CreateVideoDto = NewVideoEntity;
@Injectable()
export class VideoManagementService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async create(video: CreateVideoDto): Promise<VideoEntityProps> {
    const createdVideo = await this.videoRepository.save(
      VideoEntity.create({
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration, // TBD add logic to extract video duration
        sizeInKb: video.sizeInKb,
      })
    );
    return createdVideo;
  }
}
