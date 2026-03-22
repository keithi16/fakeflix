import { Injectable } from '@nestjs/common';
import {
  AnalyticsApi,
  ContentPerformanceMetrics,
  GenreAffinityItem,
  ResumePosition,
  TrendingContentItem,
  UserWatchHistoryItem,
} from '@tlc/shared-module/public-api';
import { AggregationFacade } from '../../aggregation/public-api/facade/aggregation.facade';

@Injectable()
export class AnalyticsFacade implements AnalyticsApi {
  constructor(private readonly aggregationFacade: AggregationFacade) {}

  getUserWatchHistory(
    userId: string,
    options?: { limit?: number; completedOnly?: boolean },
  ): Promise<UserWatchHistoryItem[]> {
    return this.aggregationFacade.getUserWatchHistory(userId, options);
  }

  getUserResumePosition(userId: string, contentId: string): Promise<ResumePosition | null> {
    return this.aggregationFacade.getResumePosition(userId, contentId);
  }

  getTrendingContent(windowType: string, limit?: number): Promise<TrendingContentItem[]> {
    return this.aggregationFacade.getTrendingContent(windowType, limit);
  }

  getContentPerformanceMetrics(contentId: string): Promise<ContentPerformanceMetrics | null> {
    return this.aggregationFacade.getContentPerformanceMetrics(contentId);
  }

  getUserGenreAffinities(userId: string): Promise<GenreAffinityItem[]> {
    return this.aggregationFacade.getUserGenreAffinities(userId);
  }
}
