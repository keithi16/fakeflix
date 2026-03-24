import { Injectable } from '@nestjs/common';
import {
  ContentPerformanceMetrics,
  GenreAffinityItem,
  ResumePosition,
  TrendingContentItem,
  UserWatchHistoryItem,
} from '@tlc/shared-module/public-api';
import { ReportingQueryService } from '../../core/service/reporting-query.service';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';
import { AggregationQueryService } from '../../core/service/aggregation-query.service';
import {
  ContentPerformanceView,
  TrendingContentView,
  UserWatchHistoryView,
} from '../types/aggregation-reporting-views';

@Injectable()
export class AggregationFacade {
  constructor(
    private readonly queryService: AggregationQueryService,
    private readonly reportingQueryService: ReportingQueryService,
  ) {}

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

  // --- Reporting ---

  getContentPerformancePaginated(options: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<[ContentPerformanceView[], number]> {
    return this.reportingQueryService.getContentPerformancePaginated(options);
  }

  getContentPerformanceById(contentId: string): Promise<ContentPerformanceView | null> {
    return this.reportingQueryService.getContentPerformanceById(contentId);
  }

  getTopContentByMetric(
    metric: keyof ContentPerformanceView,
    limit: number,
  ): Promise<ContentPerformanceView[]> {
    return this.reportingQueryService.getTopContentByMetric(metric, limit);
  }

  getBottomContentByMetric(
    metric: keyof ContentPerformanceView,
    limit: number,
  ): Promise<ContentPerformanceView[]> {
    return this.reportingQueryService.getBottomContentByMetric(metric, limit);
  }

  getUserEngagementSummary(): Promise<{ totalBingeSessions: number }> {
    return this.reportingQueryService.getUserEngagementSummary();
  }

  getUserEngagementDetail(userId: string): Promise<{
    recentHistory: UserWatchHistoryView[];
    bingeSessionCount: number;
  }> {
    return this.reportingQueryService.getUserEngagementDetail(userId);
  }

  getTrendingByWindow(
    windowType: AnalyticsTrendingWindowType,
    limit?: number,
  ): Promise<TrendingContentView[]> {
    return this.reportingQueryService.getTrendingByWindow(windowType, limit);
  }
}
