import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { runInTransaction } from 'typeorm-transactional';
import { MovieContent } from '../../../../shared/core';
import { Thumbnail } from '../../../../shared/persistence/entity/thumbnail.entity';
import { Video } from '../../../../shared/persistence/entity/video.entity';
import { ExternalMovieRatingClient } from '../../http/client/external-movie-rating/external-movie-rating.client';
import { ContentRepository } from '../../../shared/persistence/repository/content.repository';
import { VideoProcessorService } from '../../../shared/core/service/video-processor.service';

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
  }): Promise<MovieContent> {
    const externalRating = await this.externalMovieRatingClient.getRating(video.title);
    
    const content = MovieContent.create({
      title: video.title,
      description: video.description,
      ageRecommendation: null,
      externalRating: externalRating ?? null,
      video: new Video({
        url: video.videoUrl,
        sizeInKb: video.sizeInKb,
      }),
      thumbnail: video.thumbnailUrl ? new Thumbnail({
        url: video.thumbnailUrl,
      }) : null,
    });

    return await runInTransaction(
      async () => {
        const savedContent = await this.contentRepository.saveMovieContent(content);
        await this.videoProcessorService.processMetadataAndModeration(savedContent.video);
        this.appLogger.log(`Created movie with id ${savedContent.id}`, {
          contentBody: savedContent,
        });
        return savedContent;
      },
      {
        connectionName: 'content',
      }
    );
  }
}
