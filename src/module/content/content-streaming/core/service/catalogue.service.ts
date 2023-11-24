import { Injectable } from '@nestjs/common';
import { ContentEntity } from '@src/module/content/shared/core/entity/content.entity';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { ContentRepository } from '@src/module/content/shared/persistence/repository/content.repository';
import { VideoRepository } from '@src/module/content/shared/persistence/repository/video.repository';

export interface ContentFilterOpts {
  movie: string;
}

@Injectable()
export class CatalogueService {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly contentRepository: ContentRepository
  ) {}
  async listContent(filter?: ContentFilterOpts): Promise<ContentEntity[]> {
    return this.contentRepository.findAll(filter);
  }

  async getVideoInfo(id: string): Promise<VideoEntity | null> {
    return this.videoRepository.findById(id);
  }
}
