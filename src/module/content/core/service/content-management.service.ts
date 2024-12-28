import { Injectable } from '@nestjs/common';
import { MovieContentModel } from '@src/module/content/core/model/movie-content.model';
import { TvShowContentModel } from '@src/module/content/core/model/tv-show-content.model';
import { ExternalMovieRatingClient } from '@src/module/content/http/client/external-movie-rating/external-movie-rating.client';
import { Movie } from '@src/module/content/persistence/entity/movie.entity';
import { Thumbnail } from '@src/module/content/persistence/entity/thumbnail.entity';
import { TvShow } from '@src/module/content/persistence/entity/tv-show.entity';
import { Video } from '@src/module/content/persistence/entity/video.entity';
import { ContentRepository } from '@src/module/content/persistence/repository/content.repository';
import { ContentManagementOperationType } from '@src/shared/event/content/content-management.event';
import { EntityChangedEvent } from '@src/shared/event/entity-changed.event';
import { EventEmitterService } from '@src/shared/module/event/service/event-emitter.service';
import { AppLogger } from '@src/shared/module/logger/service/app-logger.service';

export interface ExternalMovieRating {
  rating: number;
}

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly contentRepository: ContentRepository,
    /**
     * TODO wrap the event emitter into our own service
     * To allow easy swapping of the event emitter library
     */
    private readonly eventEmitter: EventEmitterService,
    private readonly externalMovieRatingClient: ExternalMovieRatingClient,

    private readonly appLogger: AppLogger
  ) {}

  async createMovie(video: {
    //TODO add userId
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    sizeInKb: number;
  }): Promise<MovieContentModel> {
    const externalRating = await this.externalMovieRatingClient.getRating(video.title);
    const contentModel = new MovieContentModel({
      title: video.title,
      description: video.description,
      ageRecommendation: null,
      movie: new Movie({
        externalRating: externalRating ?? null,
        video: new Video({
          url: video.videoUrl,
          duration: video.duration,
          sizeInKb: video.sizeInKb,
        }),
      }),
    });

    if (video.thumbnailUrl) {
      contentModel.movie.thumbnail = new Thumbnail({
        url: video.thumbnailUrl,
      });
    }
    const content = await this.contentRepository.saveMovie(contentModel);
    this.eventEmitter.emit(
      ContentManagementOperationType.CONTENT_CREATED,
      new EntityChangedEvent(
        ContentManagementOperationType.CONTENT_CREATED,
        content.id,
        content
      )
    );
    this.appLogger.log(`Created movie with id ${content.id}`, {
      contentBody: content,
    });
    return content;
  }

  async createTvShow(tvShow: {
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
