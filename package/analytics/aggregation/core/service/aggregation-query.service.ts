import { Injectable } from '@nestjs/common';
import {
  ContentPerformanceMetrics,
  GenreAffinityItem,
  ResumePosition,
  TrendingContentItem,
  UserWatchHistoryItem,
} from '@tlc/shared-module/public-api';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';
import { ContentPerformanceRepository } from '../../../shared/persistence/repository/content-performance.repository';
import { GenreAffinityRepository } from '../../../shared/persistence/repository/genre-affinity.repository';
import { TrendingContentRepository } from '../../../shared/persistence/repository/trending-content.repository';
import { UserWatchHistoryRepository } from '../../../shared/persistence/repository/user-watch-history.repository';

@Injectable()
export class AggregationQueryService {
  constructor(
    private readonly watchHistoryRepository: UserWatchHistoryRepository,
    private readonly contentPerformanceRepository: ContentPerformanceRepository,
    private readonly trendingContentRepository: TrendingContentRepository,
    private readonly genreAffinityRepository: GenreAffinityRepository,
  ) {}

  async getUserWatchHistory(
    userId: string,
    options?: { limit?: number; completedOnly?: boolean },
  ): Promise<UserWatchHistoryItem[]> {
    const entries = await this.watchHistoryRepository.findByUser(userId, options);
    return entries.map((e) => ({
      contentId: e.contentId,
      contentType: e.contentType,
      lastWatchedPositionMs: Number(e.lastWatchedPositionMs),
      totalWatchTimeMs: Number(e.totalWatchTimeMs),
      completionPercentage: Number(e.completionPercentage),
      completed: e.completed,
      watchCount: e.watchCount,
      firstWatchedAt: e.firstWatchedAt,
      lastWatchedAt: e.lastWatchedAt,
    }));
  }

  async getResumePosition(userId: string, contentId: string): Promise<ResumePosition | null> {
    const entry = await this.watchHistoryRepository.findByUserAndContent(userId, contentId);
    if (!entry) return null;
    return {
      positionMs: Number(entry.lastWatchedPositionMs),
      completionPercentage: Number(entry.completionPercentage),
    };
  }

  async getTrendingContent(
    windowType: string,
    limit?: number,
  ): Promise<TrendingContentItem[]> {
    const entries = await this.trendingContentRepository.findLatestByWindowType(
      windowType as AnalyticsTrendingWindowType,
      limit,
    );
    return entries.map((e) => ({
      contentId: e.contentId,
      contentType: e.contentType,
      rank: e.rank,
      trendingScore: Number(e.trendingScore),
      viewCount: e.viewCount,
      uniqueViewers: e.uniqueViewers,
    }));
  }

  async getContentPerformanceMetrics(
    contentId: string,
  ): Promise<ContentPerformanceMetrics | null> {
    const entry = await this.contentPerformanceRepository.findByContentId(contentId);
    if (!entry) return null;
    return {
      contentId: entry.contentId,
      contentType: entry.contentType,
      totalViews: entry.totalViews,
      uniqueViewers: entry.uniqueViewers,
      totalWatchTimeMs: Number(entry.totalWatchTimeMs),
      avgCompletionPercentage: Number(entry.avgCompletionPercentage),
      completionCount: entry.completionCount,
    };
  }

  async getUserGenreAffinities(userId: string): Promise<GenreAffinityItem[]> {
    const entries = await this.genreAffinityRepository.findByUser(userId);
    return entries.map((e) => ({
      genre: e.genre,
      affinityScore: Number(e.affinityScore),
      totalWatchTimeMs: Number(e.totalWatchTimeMs),
      contentCount: e.contentCount,
    }));
  }
}
