import { Inject, Injectable } from '@nestjs/common';
import pLimit from 'p-limit';
import {
  AnalyticsApi,
  ContentCatalogApi,
} from '@tlc/shared-module/public-api';
import { Transactional } from 'typeorm-transactional';
import { PreComputedRecommendation } from '../../persistence/entity/pre-computed-recommendation.entity';
import { PreComputedRecommendationRepository } from '../../persistence/repository/pre-computed-recommendation.repository';

export interface RecommendationItem {
  contentId: string;
  title: string;
  type: string;
  score: number;
  rank: number;
  matchedGenres: string[];
}

const MAX_RECOMMENDATIONS = 20;

@Injectable()
export class RecommendationComputationService {
  constructor(
    @Inject(AnalyticsApi) private readonly analyticsApi: AnalyticsApi,
    @Inject(ContentCatalogApi) private readonly contentCatalogApi: ContentCatalogApi,
    private readonly preComputedRecommendationRepository: PreComputedRecommendationRepository
  ) {}

  @Transactional({ connectionName: 'recommendations' })
  async computeForUser(userId: string): Promise<RecommendationItem[]> {
    const [affinities, completedHistory, catalog] = await Promise.all([
      this.analyticsApi.getUserGenreAffinities(userId),
      this.analyticsApi.getUserWatchHistory(userId, { completedOnly: true }),
      this.contentCatalogApi.findAllWithGenres(),
    ]);

    const completedContentIds = new Set(completedHistory.map((h) => h.contentId));
    const affinityMap = new Map(affinities.map((a) => [a.genre, a.affinityScore]));

    const scored = catalog
      .filter((item) => !completedContentIds.has(item.id))
      .map((item) => {
        const matchedGenres = item.genres.filter((g) => affinityMap.has(g));
        const score = matchedGenres.reduce((sum, g) => sum + (affinityMap.get(g) ?? 0), 0);
        return { item, score, matchedGenres };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RECOMMENDATIONS);

    const results: RecommendationItem[] = scored.map(({ item, score, matchedGenres }, index) => ({
      contentId: item.id,
      title: item.title,
      type: item.type,
      score,
      rank: index + 1,
      matchedGenres,
    }));

    await this.preComputedRecommendationRepository.replaceForUser(
      userId,
      results.map((r) => ({
        userId,
        contentId: r.contentId,
        score: r.score,
        rank: r.rank,
        matchedGenres: r.matchedGenres,
        computedAt: new Date(),
      })) as unknown as Omit<PreComputedRecommendation, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[]
    );

    return results;
  }

  async recomputeAll(): Promise<void> {
    const userIds = await this.preComputedRecommendationRepository.getDistinctUserIds();
    const limit = pLimit(5);
    await Promise.all(userIds.map((userId) => limit(() => this.computeForUser(userId))));
  }
}
