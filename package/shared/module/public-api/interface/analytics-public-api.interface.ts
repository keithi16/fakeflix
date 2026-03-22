export interface UserWatchHistoryItem {
  contentId: string;
  contentType: string;
  lastWatchedPositionMs: number;
  totalWatchTimeMs: number;
  completionPercentage: number;
  completed: boolean;
  watchCount: number;
  firstWatchedAt: Date;
  lastWatchedAt: Date;
}

export interface ResumePosition {
  positionMs: number;
  completionPercentage: number;
}

export interface TrendingContentItem {
  contentId: string;
  contentType: string;
  rank: number;
  trendingScore: number;
  viewCount: number;
  uniqueViewers: number;
}

export interface ContentPerformanceMetrics {
  contentId: string;
  contentType: string;
  totalViews: number;
  uniqueViewers: number;
  totalWatchTimeMs: number;
  avgCompletionPercentage: number;
  completionCount: number;
}

export interface GenreAffinityItem {
  genre: string;
  affinityScore: number;
  totalWatchTimeMs: number;
  contentCount: number;
}

export interface AnalyticsApi {
  getUserWatchHistory(
    userId: string,
    options?: { limit?: number; completedOnly?: boolean }
  ): Promise<UserWatchHistoryItem[]>;

  getUserResumePosition(userId: string, contentId: string): Promise<ResumePosition | null>;

  getTrendingContent(windowType: string, limit?: number): Promise<TrendingContentItem[]>;

  getContentPerformanceMetrics(contentId: string): Promise<ContentPerformanceMetrics | null>;

  getUserGenreAffinities(userId: string): Promise<GenreAffinityItem[]>;
}

export const AnalyticsApi = Symbol('AnalyticsApi');
