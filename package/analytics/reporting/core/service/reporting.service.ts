import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { AggregationFacade } from '../../../aggregation/public-api/facade/aggregation.facade';
import {
  ContentPerformanceView,
  TrendingContentView,
  UserWatchHistoryView,
} from '../../../aggregation/public-api/types/aggregation-reporting-views';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';
import {
  ContentPerformanceQueryDto,
  TopBottomContentQueryDto,
} from '../../http/rest/dto/content-performance-query.dto';
import { TrendingQueryDto } from '../../http/rest/dto/trending-query.dto';
import { UserEngagementQueryDto } from '../../http/rest/dto/user-engagement-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable()
export class ReportingService {
  constructor(
    private readonly aggregationFacade: AggregationFacade,
    private readonly logger: AppLogger,
  ) {}

  async getContentPerformance(
    query: ContentPerformanceQueryDto,
  ): Promise<PaginatedResult<ContentPerformanceView>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, totalItems] = await this.aggregationFacade.getContentPerformancePaginated({
      page,
      limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getContentPerformanceDetail(contentId: string): Promise<ContentPerformanceView | null> {
    return this.aggregationFacade.getContentPerformanceById(contentId);
  }

  async getTopContent(query: TopBottomContentQueryDto): Promise<ContentPerformanceView[]> {
    const metric = (query.metric ?? 'totalViews') as keyof ContentPerformanceView;
    return this.aggregationFacade.getTopContentByMetric(metric, query.limit ?? 10);
  }

  async getBottomContent(query: TopBottomContentQueryDto): Promise<ContentPerformanceView[]> {
    const metric = (query.metric ?? 'totalViews') as keyof ContentPerformanceView;
    return this.aggregationFacade.getBottomContentByMetric(metric, query.limit ?? 10);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUserEngagement(_query: UserEngagementQueryDto): Promise<{
    totalUsers: number;
    totalWatchTimeMs: number;
    totalBingeSessions: number;
    avgCompletionPercentage: number;
  }> {
    const { totalBingeSessions } = await this.aggregationFacade.getUserEngagementSummary();
    return {
      totalUsers: 0,
      totalWatchTimeMs: 0,
      totalBingeSessions,
      avgCompletionPercentage: 0,
    };
  }

  async getUserEngagementDetail(userId: string): Promise<{
    userId: string;
    totalWatchTimeMs: number;
    completionPercentage: number;
    bingeSessions: number;
    recentHistory: UserWatchHistoryView[];
  }> {
    const { recentHistory, bingeSessionCount } =
      await this.aggregationFacade.getUserEngagementDetail(userId);

    const totalWatchTimeMs = recentHistory.reduce(
      (sum, h) => sum + Number(h.totalWatchTimeMs),
      0,
    );
    const avgCompletion =
      recentHistory.length > 0
        ? recentHistory.reduce((sum, h) => sum + Number(h.completionPercentage), 0) /
          recentHistory.length
        : 0;

    return {
      userId,
      totalWatchTimeMs,
      completionPercentage: avgCompletion,
      bingeSessions: bingeSessionCount,
      recentHistory,
    };
  }

  async getTrending(query: TrendingQueryDto): Promise<{
    windowType: string;
    items: TrendingContentView[];
  }> {
    const windowType = query.windowType ?? AnalyticsTrendingWindowType.DAILY;
    const items = await this.aggregationFacade.getTrendingByWindow(windowType, query.limit);
    return { windowType, items };
  }
}
