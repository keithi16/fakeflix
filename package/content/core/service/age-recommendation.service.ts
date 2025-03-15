import { Injectable } from '@nestjs/common';
import { MovieContentModel } from '@tlc/content/core/model/movie-content.model';
import { TvShowContentModel } from '@tlc/content/core/model/tv-show-content.model';

@Injectable()
export class AgeRecommendationService {
  async setAgeRecommendationForContent(
    content: TvShowContentModel | MovieContentModel
  ): Promise<void> {
    content.ageRecommendation = 18;
  }
}
