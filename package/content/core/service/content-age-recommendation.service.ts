import { Injectable } from '@nestjs/common';
import { MovieContentModel } from '@tlc/content/core/model/movie-content.model';
import { TvShowContentModel } from '@tlc/content/core/model/tv-show-content.model';
import { VideoMetadata } from '@tlc/content/persistence/entity/video-metadata.entity';

@Injectable()
export class ContentAgeRecommendationService {
  setAgeRecommendationForContent(
    content: TvShowContentModel | MovieContentModel,
    latestVideoMetadata: VideoMetadata
  ): void {
    /**
     * Age recommendation for the whole content is based on the highest
     * age recommendation of the videos
     * If the content has an age recommendation, it will be replaced
     */
    if (!content.ageRecommendation && latestVideoMetadata.ageRating) {
      content.ageRecommendation = latestVideoMetadata.ageRating;
      return;
    }
    if (
      content.ageRecommendation &&
      latestVideoMetadata.ageRating &&
      latestVideoMetadata.ageRating > content.ageRecommendation
    ) {
      content.ageRecommendation = latestVideoMetadata.ageRating;
    }
  }
}
