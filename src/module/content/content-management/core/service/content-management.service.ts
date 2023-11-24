import { Injectable } from '@nestjs/common';
import {
  ContentEntity,
  ContentType,
} from '@src/module/content/shared/core/entity/content.entity';
import { MovieEntity } from '@src/module/content/shared/core/entity/movie.entity';
import { ThumbnailEntity } from '@src/module/content/shared/core/entity/thumbnail.entity';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { ContentRepository } from '@src/module/content/shared/persistence/repository/content.repository';

export type CreateVideoDto = {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  sizeInKb: number;
};
@Injectable()
export class ContentManagementService {
  constructor(private readonly contentRepository: ContentRepository) {}

  async createMovie(video: CreateVideoDto): Promise<ContentEntity> {
    const content = ContentEntity.createNew({
      title: video.title,
      description: video.description,
      type: ContentType.MOVIE,
      media: MovieEntity.createNew({
        video: VideoEntity.createNew({
          url: video.videoUrl,
          duration: video.duration,
          sizeInKb: video.sizeInKb,
        }),
      }),
    });
    if (video.thumbnailUrl) {
      content.addThumbnail(ThumbnailEntity.createNew({ url: video.thumbnailUrl }));
    }

    await this.contentRepository.save(content);
    return content;
  }
}
