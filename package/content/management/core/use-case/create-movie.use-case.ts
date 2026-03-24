import { Inject, Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { MediaFacade } from '../../../media/public-api/facade/media.facade';
import { MovieContent } from '../../../shared/core';
import { Thumbnail } from '../../persistence/entity/thumbnail.entity';
import { ContentRepository } from '../../persistence/repository/content.repository';
import { ExternalMovieRatingAdapter } from '../adapter/external-movie-rating.adapter.interface';
import { VideoProcessorService } from '../service/video-processor.service';

export interface ExternalMovieRating {
  rating: number;
}

@Injectable()
export class CreateMovieUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly videoProcessorService: VideoProcessorService,
    @Inject(ExternalMovieRatingAdapter)
    private readonly externalMovieRatingClient: ExternalMovieRatingAdapter,
    private readonly mediaFacade: MediaFacade,
    private readonly appLogger: AppLogger
  ) {}

  @Transactional({ connectionName: 'content' })
  async execute(video: {
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    sizeInKb: number;
  }): Promise<MovieContent> {
    const externalRating = await this.externalMovieRatingClient.getRating(video.title);

    const { videoId } = await this.mediaFacade.createVideo(
      video.videoUrl,
      video.sizeInKb
    );

    const content = MovieContent.create({
      title: video.title,
      description: video.description,
      ageRecommendation: null,
      externalRating: externalRating ?? null,
      videoId,
      thumbnail: video.thumbnailUrl
        ? new Thumbnail({
            url: video.thumbnailUrl,
          })
        : null,
    });

    const savedContent = await this.contentRepository.saveMovieContent(content);
    await this.videoProcessorService.processMetadataAndModeration(
      videoId,
      video.videoUrl
    );
    this.appLogger.log(`Created movie with id ${savedContent.id}`, {
      contentBody: savedContent,
    });
    return savedContent;
  }
}
