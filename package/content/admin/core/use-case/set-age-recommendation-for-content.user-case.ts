import { Injectable } from '@nestjs/common';
import { ContentAgeRecommendationService } from '@tlc/content/admin/core/service/content-age-recommendation.service';
import { ContentRepository } from '@tlc/content/admin/persistence/repository/content.repository';
import { NotFoundDomainException } from '@tlc/shared-lib/core/exeption/not-found-domain.exception';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';

@Injectable()
export class SetAgeRecommendationForContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly ageRecommendationService: ContentAgeRecommendationService,
    private readonly logger: AppLogger
  ) {}

  async execute(videoId: string, ageRecommendation: number): Promise<void> {
    const content = await this.contentRepository.findContentByVideoId(videoId);
    if (!content) {
      throw new NotFoundDomainException(`Content with video ID ${videoId} not found`);
    }
    this.ageRecommendationService.setAgeRecommendationForContent(
      content,
      ageRecommendation
    );
    await this.contentRepository.saveMovieOrTvShow(content);
    this.logger.log(
      `Set age recommendation for content with video ID ${videoId} to ${ageRecommendation}`
    );
  }
}
