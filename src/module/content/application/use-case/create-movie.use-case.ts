import { Injectable } from '@nestjs/common';
import { MovieContentModel } from '@src/module/content/core/model/movie-content.model';
import { AgeRecommendationService } from '@src/module/content/core/service/age-recommendation.service';
import { VideoProcessorService } from '@src/module/content/core/service/video-processor.service';
import { ExternalMovieRatingClient } from '@src/module/content/http/client/external-movie-rating/external-movie-rating.client';
import { Movie } from '@src/module/content/persistence/entity/movie.entity';
import { Thumbnail } from '@src/module/content/persistence/entity/thumbnail.entity';
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
export class CreateMovieUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    /**
     * TODO wrap the event emitter into our own service
     * To allow easy swapping of the event emitter library
     */
    private readonly eventEmitter: EventEmitterService,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly ageRecommendationService: AgeRecommendationService,
    private readonly externalMovieRatingClient: ExternalMovieRatingClient,

    private readonly appLogger: AppLogger
  ) {}

  async execute(video: {
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
          sizeInKb: video.sizeInKb,
        }),
      }),
    });

    if (video.thumbnailUrl) {
      contentModel.movie.thumbnail = new Thumbnail({
        url: video.thumbnailUrl,
      });
    }

    Promise.all([
      await this.videoProcessorService.processMetadataAndSecurity(
        contentModel.movie.video
      ),
      await this.ageRecommendationService.setAgeRecommendationForContent(contentModel),
    ]);
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
}
