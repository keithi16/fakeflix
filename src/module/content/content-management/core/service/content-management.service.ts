import { Injectable } from '@nestjs/common';
import { ContentType } from '@src/module/content/content-management/core/enum/content-type.enum';
import { Content } from '@src/module/content/content-management/persistence/model/content.model';
import { Movie } from '@src/module/content/content-management/persistence/model/movie.model';
import { Thumbnail } from '@src/module/content/content-management/persistence/model/thumbnail.model';
import { Video } from '@src/module/content/content-management/persistence/model/video.model';
import { ContentRepository } from '@src/module/content/content-management/persistence/repository/content.repository';

@Injectable()
export class ContentManagementService {
  constructor(private readonly contentRepository: ContentRepository) {}

  async createMovie(video: {
    //TODO add userId
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    sizeInKb: number;
  }): Promise<Content> {
    const contentModel = new Content({
      title: video.title,
      description: video.description,
      type: ContentType.MOVIE,
      movie: new Movie({
        video: new Video({
          url: video.videoUrl,
          duration: video.duration,
          sizeInKb: video.sizeInKb,
        }),
      }),
    });

    if (video.thumbnailUrl) {
      contentModel.thumbnail = new Thumbnail({
        url: video.thumbnailUrl,
      });
    }

    return this.contentRepository.save(contentModel);
  }
}
