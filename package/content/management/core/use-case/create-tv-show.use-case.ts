import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { TvShowContent } from '../../../shared/core';
import { Thumbnail } from '../../persistence/entity/thumbnail.entity';
import { ContentRepository } from '../../persistence/repository/content.repository';

@Injectable()
export class CreateTvShowUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  @Transactional({ connectionName: 'content' })
  async execute(tvShow: {
    //TODO add userId
    title: string;
    description: string;
    thumbnailUrl?: string;
  }): Promise<TvShowContent> {
    const content = TvShowContent.create({
      title: tvShow.title,
      description: tvShow.description,
      ageRecommendation: null,
      releaseDate: null,
      thumbnail: tvShow.thumbnailUrl
        ? new Thumbnail({
            url: tvShow.thumbnailUrl,
          })
        : undefined,
    });

    return this.contentRepository.saveTvShowContent(content);
  }
}
