import { Injectable } from '@nestjs/common';
import { MovieContentModel } from '../model/movie-content.model';
import { VideoProcessorService } from '../service/video-processor.service';
import { ExternalMovieRatingClient } from '../../http/client/external-movie-rating/external-movie-rating.client';
import { ContentRepository } from '../../persistence/repository/content.repository';
import { Movie } from '../../../shared/persistence/entity/movie.entity';
import { Thumbnail } from '../../../shared/persistence/entity/thumbnail.entity';
import { Video } from '../../../shared/persistence/entity/video.entity';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';
import { runInTransaction } from 'typeorm-transactional';

export interface ExternalMovieRating {
  rating: number;
}

@Injectable()
export class CreateMovieUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly videoProcessorService: VideoProcessorService,
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

    return await runInTransaction(
      async () => {
        const content = await this.contentRepository.saveMovieOrTvShow(contentModel);
        await this.videoProcessorService.processMetadataAndModeration(
          contentModel.movie.video
        );
        this.appLogger.log(`Created movie with id ${content.id}`, {
          contentBody: content,
        });
        return content;
      },
      {
        connectionName: 'content',
      }
    );
  }
}
