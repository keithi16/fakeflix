import { Injectable } from '@nestjs/common';
import { MovieContentModel } from '@tlc/content/core/model/movie-content.model';
import { AgeRecommendationService } from '@tlc/content/core/service/age-recommendation.service';
import { VideoProcessorService } from '@tlc/content/core/service/video-processor.service';
import { ExternalMovieRatingClient } from '@tlc/content/http/client/external-movie-rating/external-movie-rating.client';
import { Movie } from '@tlc/content/persistence/entity/movie.entity';
import { Thumbnail } from '@tlc/content/persistence/entity/thumbnail.entity';
import { Video } from '@tlc/content/persistence/entity/video.entity';
import { ContentRepository } from '@tlc/content/persistence/repository/content.repository';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';

export interface ExternalMovieRating {
  rating: number;
}

@Injectable()
export class CreateMovieUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly ageRecommendationService: AgeRecommendationService,
    private readonly externalMovieRatingClient: ExternalMovieRatingClient,

    private readonly appLogger: AppLogger
  ) {}

  async execute(video: {
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
      await this.videoProcessorService.processMetadataAndModeration(
        contentModel.movie.video
      ),
      await this.ageRecommendationService.setAgeRecommendationForContent(
        contentModel,
        contentModel.movie.video.metadata
      ),
    ]);
    const content = await this.contentRepository.saveMovie(contentModel);

    this.appLogger.log(`Created movie with id ${content.id}`, {
      contentBody: content,
    });
    return content;
  }
}
