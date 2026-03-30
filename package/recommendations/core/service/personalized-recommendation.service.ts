import { Inject, Injectable } from '@nestjs/common';
import { AnalyticsApi, ContentCatalogApi } from '@tlc/shared-module/public-api';
import { PreComputedRecommendation } from '../../persistence/entity/pre-computed-recommendation.entity';
import { PreComputedRecommendationRepository } from '../../persistence/repository/pre-computed-recommendation.repository';
import { RecommendationComputationService, RecommendationItem } from './recommendation-computation.service';

const MAX_RECOMMENDATIONS = 20;

@Injectable()
export class PersonalizedRecommendationService {
  constructor(
    @Inject(AnalyticsApi) private readonly analyticsApi: AnalyticsApi,
    @Inject(ContentCatalogApi) private readonly contentCatalogApi: ContentCatalogApi,
    private readonly preComputedRepo: PreComputedRecommendationRepository,
    private readonly computationService: RecommendationComputationService,
  ) {}

  async getForUser(userId: string | null): Promise<RecommendationItem[]> {
    if (!userId) {
      return this.getTrending();
    }

    try {
      const cached = await this.preComputedRepo.findByUserId(userId);
      if (cached.length > 0) {
        return this.mapToRecommendationItems(cached);
      }

      const computed = await this.computationService.computeForUser(userId);
      if (computed.length === 0) {
        return this.getTrending();
      }

      return computed;
    } catch {
      return this.getTrending();
    }
  }

  private async getTrending(): Promise<RecommendationItem[]> {
    const trending = await this.analyticsApi.getTrendingContent('daily', MAX_RECOMMENDATIONS);
    return trending.map((item, index) => ({
      contentId: item.contentId,
      title: '',
      type: item.contentType,
      score: item.trendingScore,
      rank: item.rank ?? index + 1,
      matchedGenres: [],
    }));
  }

  private async mapToRecommendationItems(entities: PreComputedRecommendation[]): Promise<RecommendationItem[]> {
    const catalog = (await this.contentCatalogApi.findAllWithGenres()) ?? [];
    const catalogMap = new Map(catalog.map((item) => [item.id, item]));
    return entities.map((e) => {
      const catalogItem = catalogMap.get(e.contentId);
      return {
        contentId: e.contentId,
        title: catalogItem?.title ?? '',
        type: catalogItem?.type ?? '',
        score: Number(e.score),
        rank: e.rank,
        matchedGenres: e.matchedGenres,
      };
    });
  }
}
