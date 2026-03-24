import { AnalyticsContentType } from '../../../shared/enum/analytics-content-type.enum';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';

export interface ContentPerformanceView {
  contentId: string;
  contentType: AnalyticsContentType;
  totalViews: number;
  uniqueViewers: number;
  totalWatchTimeMs: number;
  avgCompletionPercentage: number;
  completionCount: number;
  lastComputedAt: Date;
}

export interface TrendingContentView {
  contentId: string;
  contentType: AnalyticsContentType;
  windowType: AnalyticsTrendingWindowType;
  windowStart: Date;
  windowEnd: Date;
  viewCount: number;
  uniqueViewers: number;
  trendingScore: number;
  rank: number;
  computedAt: Date;
}

export interface UserWatchHistoryView {
  userId: string;
  contentId: string;
  contentType: AnalyticsContentType;
  lastWatchedPositionMs: number;
  totalWatchTimeMs: number;
  completionPercentage: number;
  completed: boolean;
  watchCount: number;
  firstWatchedAt: Date;
  lastWatchedAt: Date;
}
