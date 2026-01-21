import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@tlc/shared-lib/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { ContentRepository } from '../../persistence/repository/content.repository';
import { ContentAgeRecommendationService } from '../service/content-age-recommendation.service';

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
    await this.contentRepository.save(content);
    this.logger.log(
      `Set age recommendation for content with video ID ${videoId} to ${ageRecommendation}`
    );
  }
}
