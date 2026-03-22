import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { AnalyticsContentPerformance } from '../../../shared/persistence/entity/analytics-content-performance.entity';
import { AnalyticsTrendingContent } from '../../../shared/persistence/entity/analytics-trending-content.entity';
import { AnalyticsUserWatchHistory } from '../../../shared/persistence/entity/analytics-user-watch-history.entity';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';
import { BingeSessionRepository } from '../../../shared/persistence/repository/binge-session.repository';
import { ContentPerformanceRepository } from '../../../shared/persistence/repository/content-performance.repository';
import { GenreAffinityRepository } from '../../../shared/persistence/repository/genre-affinity.repository';
import { TrendingContentRepository } from '../../../shared/persistence/repository/trending-content.repository';
import { UserWatchHistoryRepository } from '../../../shared/persistence/repository/user-watch-history.repository';
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
    private readonly contentPerformanceRepository: ContentPerformanceRepository,
    private readonly watchHistoryRepository: UserWatchHistoryRepository,
    private readonly trendingContentRepository: TrendingContentRepository,
    private readonly bingeSessionRepository: BingeSessionRepository,
    private readonly genreAffinityRepository: GenreAffinityRepository,
    private readonly logger: AppLogger,
  ) {}

  async getContentPerformance(
    query: ContentPerformanceQueryDto,
  ): Promise<PaginatedResult<AnalyticsContentPerformance>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, totalItems] = await this.contentPerformanceRepository.findPaginated({
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

  async getContentPerformanceDetail(
    contentId: string,
  ): Promise<AnalyticsContentPerformance | null> {
    return this.contentPerformanceRepository.findByContentId(contentId);
  }

  async getTopContent(query: TopBottomContentQueryDto): Promise<AnalyticsContentPerformance[]> {
    const metric = query.metric ?? 'totalViews';
    return this.contentPerformanceRepository.findTopByMetric(
      metric as keyof AnalyticsContentPerformance,
      query.limit ?? 10,
    );
  }

  async getBottomContent(
    query: TopBottomContentQueryDto,
  ): Promise<AnalyticsContentPerformance[]> {
    const metric = query.metric ?? 'totalViews';
    return this.contentPerformanceRepository.findBottomByMetric(
      metric as keyof AnalyticsContentPerformance,
      query.limit ?? 10,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUserEngagement(_query: UserEngagementQueryDto): Promise<{
    totalUsers: number;
    totalWatchTimeMs: number;
    totalBingeSessions: number;
    avgCompletionPercentage: number;
  }> {
    const totalBingeSessions = await this.bingeSessionRepository.countAll();
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
    recentHistory: AnalyticsUserWatchHistory[];
  }> {
    const [recentHistory, bingeSessions] = await Promise.all([
      this.watchHistoryRepository.findByUser(userId, { limit: 10 }),
      this.bingeSessionRepository.countByUserId(userId),
    ]);

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
      bingeSessions,
      recentHistory,
    };
  }

  async getTrending(query: TrendingQueryDto): Promise<{
    windowType: string;
    items: AnalyticsTrendingContent[];
  }> {
    const windowType = query.windowType ?? AnalyticsTrendingWindowType.DAILY;
    const items = await this.trendingContentRepository.findLatestByWindowType(
      windowType,
      query.limit,
    );
    return { windowType, items };
  }
}
