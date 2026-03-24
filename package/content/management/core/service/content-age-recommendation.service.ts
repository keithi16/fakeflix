import { Injectable } from '@nestjs/common';
import { Content } from '../../persistence/entity/content.entity';

@Injectable()
export class ContentAgeRecommendationService {
  setAgeRecommendationForContent(
    content: Content,
    lastAgeRecommendation: number
  ): void {
    /**
     * Age recommendation for the whole content is based on the highest
     * age recommendation of the videos
     * If the content has an age recommendation, it will be replaced
     */
    if (!content.ageRecommendation && lastAgeRecommendation) {
      content.ageRecommendation = lastAgeRecommendation;
      return;
    }
    if (
      content.ageRecommendation &&
      lastAgeRecommendation &&
      lastAgeRecommendation > content.ageRecommendation
    ) {
      content.ageRecommendation = lastAgeRecommendation;
    }
  }
}
