import { Injectable } from '@nestjs/common';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';
import {
  ContentPerformanceView,
  TrendingContentView,
  UserWatchHistoryView,
} from '../../public-api/types/aggregation-reporting-views';
import { BingeSessionRepository } from '../../persistence/repository/binge-session.repository';
import { ContentPerformanceRepository } from '../../persistence/repository/content-performance.repository';
import { TrendingContentRepository } from '../../persistence/repository/trending-content.repository';
import { UserWatchHistoryRepository } from '../../persistence/repository/user-watch-history.repository';

@Injectable()
export class ReportingQueryService {
  constructor(
    private readonly contentPerformanceRepository: ContentPerformanceRepository,
    private readonly trendingContentRepository: TrendingContentRepository,
    private readonly watchHistoryRepository: UserWatchHistoryRepository,
    private readonly bingeSessionRepository: BingeSessionRepository,
  ) {}

  async getContentPerformancePaginated(options: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<[ContentPerformanceView[], number]> {
    const [entities, count] = await this.contentPerformanceRepository.findPaginated(options);
    return [entities.map(this.toContentPerformanceView), count];
  }

  async getContentPerformanceById(contentId: string): Promise<ContentPerformanceView | null> {
    const entity = await this.contentPerformanceRepository.findByContentId(contentId);
    return entity ? this.toContentPerformanceView(entity) : null;
  }

  async getTopContentByMetric(
    metric: keyof ContentPerformanceView,
    limit: number,
  ): Promise<ContentPerformanceView[]> {
    const entities = await this.contentPerformanceRepository.findTopByMetric(
      metric as never,
      limit,
    );
    return entities.map(this.toContentPerformanceView);
  }

  async getBottomContentByMetric(
    metric: keyof ContentPerformanceView,
    limit: number,
  ): Promise<ContentPerformanceView[]> {
    const entities = await this.contentPerformanceRepository.findBottomByMetric(
      metric as never,
      limit,
    );
    return entities.map(this.toContentPerformanceView);
  }

  async getUserEngagementSummary(): Promise<{ totalBingeSessions: number }> {
    const totalBingeSessions = await this.bingeSessionRepository.countAll();
    return { totalBingeSessions };
  }

  async getUserEngagementDetail(userId: string): Promise<{
    recentHistory: UserWatchHistoryView[];
    bingeSessionCount: number;
  }> {
    const [recentHistory, bingeSessionCount] = await Promise.all([
      this.watchHistoryRepository.findByUser(userId, { limit: 10 }),
      this.bingeSessionRepository.countByUserId(userId),
    ]);
    return { recentHistory: recentHistory.map(this.toUserWatchHistoryView), bingeSessionCount };
  }

  async getTrendingByWindow(
    windowType: AnalyticsTrendingWindowType,
    limit?: number,
  ): Promise<TrendingContentView[]> {
    const entities = await this.trendingContentRepository.findLatestByWindowType(
      windowType,
      limit,
    );
    return entities.map(this.toTrendingContentView);
  }

  private toContentPerformanceView(e: {
    contentId: string;
    contentType: import('../../../shared/enum/analytics-content-type.enum').AnalyticsContentType;
    totalViews: number;
    uniqueViewers: number;
    totalWatchTimeMs: number;
    avgCompletionPercentage: number;
    completionCount: number;
    lastComputedAt: Date;
  }): ContentPerformanceView {
    return {
      contentId: e.contentId,
      contentType: e.contentType,
      totalViews: e.totalViews,
      uniqueViewers: e.uniqueViewers,
      totalWatchTimeMs: Number(e.totalWatchTimeMs),
      avgCompletionPercentage: Number(e.avgCompletionPercentage),
      completionCount: e.completionCount,
      lastComputedAt: e.lastComputedAt,
    };
  }

  private toUserWatchHistoryView(e: {
    userId: string;
    contentId: string;
    contentType: import('../../../shared/enum/analytics-content-type.enum').AnalyticsContentType;
    lastWatchedPositionMs: number;
    totalWatchTimeMs: number;
    completionPercentage: number;
    completed: boolean;
    watchCount: number;
    firstWatchedAt: Date;
    lastWatchedAt: Date;
  }): UserWatchHistoryView {
    return {
      userId: e.userId,
      contentId: e.contentId,
      contentType: e.contentType,
      lastWatchedPositionMs: Number(e.lastWatchedPositionMs),
      totalWatchTimeMs: Number(e.totalWatchTimeMs),
      completionPercentage: Number(e.completionPercentage),
      completed: e.completed,
      watchCount: e.watchCount,
      firstWatchedAt: e.firstWatchedAt,
      lastWatchedAt: e.lastWatchedAt,
    };
  }

  private toTrendingContentView(e: {
    contentId: string;
    contentType: import('../../../shared/enum/analytics-content-type.enum').AnalyticsContentType;
    windowType: AnalyticsTrendingWindowType;
    windowStart: Date;
    windowEnd: Date;
    viewCount: number;
    uniqueViewers: number;
    trendingScore: number;
    rank: number;
    computedAt: Date;
  }): TrendingContentView {
    return {
      contentId: e.contentId,
      contentType: e.contentType,
      windowType: e.windowType,
      windowStart: e.windowStart,
      windowEnd: e.windowEnd,
      viewCount: e.viewCount,
      uniqueViewers: e.uniqueViewers,
      trendingScore: Number(e.trendingScore),
      rank: e.rank,
      computedAt: e.computedAt,
    };
  }
}
