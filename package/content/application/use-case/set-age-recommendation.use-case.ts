import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  AgeRecommendationSchema,
  VideoAgeRecommendationAdapter,
} from '@tlc/content/core/adapter/video-recommendation.adapter.interface';
import { ContentAgeRecommendationService } from '@tlc/content/core/service/content-age-recommendation.service';
import { VideoMetadata } from '@tlc/content/persistence/entity/video-metadata.entity';
import { Video } from '@tlc/content/persistence/entity/video.entity';
import { ContentRepository } from '@tlc/content/persistence/repository/content.repository';
import { VideoMetadataRepository } from '@tlc/content/persistence/repository/video-metadata.repository';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';
import { runInTransaction } from 'typeorm-transactional';

@Injectable()
export class SetAgeRecommendationUseCase {
  constructor(
    @Inject(VideoAgeRecommendationAdapter)
    private readonly videoAgeRecommendationProcessor: VideoAgeRecommendationAdapter,
    private readonly videoMetadataRepository: VideoMetadataRepository,
    private readonly contentAgeRecommendationService: ContentAgeRecommendationService,
    private readonly contentRepository: ContentRepository,
    private readonly logger: AppLogger
  ) {}

  public async setAgeRecommendation(video: Video): Promise<void> {
    const ageRecommendation =
      await this.videoAgeRecommendationProcessor.getAgeRecommendation(video.url);
    if (!ageRecommendation) {
      throw new Error(
        `Failed to generate age recommendation for video with ID ${video.id}`
      );
    }
    this.logger.log(`Generated age recommendation for video ID ${video.id}`, {
      ageRecommendation,
      videoId: video.id,
    });

    const metadata = await this.getAndPopulateMetadata(video, ageRecommendation);

    const content = await this.contentRepository.findContentByVideoId(video.id);
    if (!content) {
      throw new BadRequestException(`Content not found for video with ID ${video.id}`);
    }

    await runInTransaction(
      async () => {
        await this.videoMetadataRepository.save(metadata);
        this.contentAgeRecommendationService.setAgeRecommendationForContent(
          content,
          metadata
        );
        await this.contentRepository.saveMovieOrTvShow(content);
      },
      {
        connectionName: 'content',
      }
    );
  }

  private async getAndPopulateMetadata(
    video: Video,
    ageRecommendation: AgeRecommendationSchema
  ): Promise<VideoMetadata> {
    const metadata = await this.videoMetadataRepository.findOne({
      where: { video },
    });

    if (metadata) {
      metadata.ageRating = ageRecommendation?.ageRating;
      metadata.ageRatingExplanation = ageRecommendation?.explanation;
      metadata.ageRatingCategories = ageRecommendation?.categories;
      return metadata;
    }

    return new VideoMetadata({
      ageRating: ageRecommendation?.ageRating,
      ageRatingExplanation: ageRecommendation?.explanation,
      ageRatingCategories: ageRecommendation?.categories,
      video,
    });
  }
}
