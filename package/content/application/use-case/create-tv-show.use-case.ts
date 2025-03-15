import { Injectable } from '@nestjs/common';
import { TvShowContentModel } from '@tlc/content/core/model/tv-show-content.model';
import { Thumbnail } from '@tlc/content/persistence/entity/thumbnail.entity';
import { TvShow } from '@tlc/content/persistence/entity/tv-show.entity';
import { ContentRepository } from '@tlc/content/persistence/repository/content.repository';

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
    return await this.contentRepository.saveTvShow(content);
  }
}
