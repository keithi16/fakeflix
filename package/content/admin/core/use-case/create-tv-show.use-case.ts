import { Injectable } from '@nestjs/common';
import { TvShowContentModel } from '../model/tv-show-content.model';
import { ContentRepository } from '../../persistence/repository/content.repository';
import { Thumbnail } from '../../../shared/persistence/entity/thumbnail.entity';
import { TvShow } from '../../../shared/persistence/entity/tv-show.entity';

@Injectable()
export class CreateTvShowUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(tvShow: {
    //TODO add userId
    title: string;
    description: string;
    thumbnailUrl?: string;
  }): Promise<TvShowContentModel> {
    const content = new TvShowContentModel({
      title: tvShow.title,
      description: tvShow.description,
      tvShow: new TvShow({}),
    });

    if (tvShow.thumbnailUrl && content.tvShow) {
      content.tvShow.thumbnail = new Thumbnail({
        url: tvShow.thumbnailUrl,
      });
    }
    return await this.contentRepository.saveMovieOrTvShow(content);
  }
}
