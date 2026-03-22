import { Injectable } from '@nestjs/common';
import {
  ContentPerformanceMetrics,
  GenreAffinityItem,
  ResumePosition,
  TrendingContentItem,
  UserWatchHistoryItem,
} from '@tlc/shared-module/public-api';
import { AggregationQueryService } from '../../core/service/aggregation-query.service';

@Injectable()
export class AggregationFacade {
  constructor(private readonly queryService: AggregationQueryService) {}

  getUserWatchHistory(
    userId: string,
    options?: { limit?: number; completedOnly?: boolean },
  ): Promise<UserWatchHistoryItem[]> {
    return this.queryService.getUserWatchHistory(userId, options);
  }

  getResumePosition(userId: string, contentId: string): Promise<ResumePosition | null> {
    return this.queryService.getResumePosition(userId, contentId);
  }

  getTrendingContent(windowType: string, limit?: number): Promise<TrendingContentItem[]> {
    return this.queryService.getTrendingContent(windowType, limit);
  }

  getContentPerformanceMetrics(contentId: string): Promise<ContentPerformanceMetrics | null> {
    return this.queryService.getContentPerformanceMetrics(contentId);
  }

  getUserGenreAffinities(userId: string): Promise<GenreAffinityItem[]> {
    return this.queryService.getUserGenreAffinities(userId);
  }
}
