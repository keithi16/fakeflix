import { Expose, Type } from 'class-transformer';

export class WatchHistoryItemDto {
  @Expose() contentId: string;
  @Expose() contentType: string;
  @Expose() lastWatchedPositionMs: number;
  @Expose() completionPercentage: number;
  @Expose() completed: boolean;
  @Expose() lastWatchedAt: Date;
}

export class UserEngagementSummaryResponseDto {
  @Expose() totalUsers: number;
  @Expose() totalWatchTimeMs: number;
  @Expose() totalBingeSessions: number;
  @Expose() avgCompletionPercentage: number;
}

export class UserEngagementDetailResponseDto {
  @Expose() userId: string;
  @Expose() totalWatchTimeMs: number;
  @Expose() completionPercentage: number;
  @Expose() bingeSessions: number;
  @Expose() @Type(() => WatchHistoryItemDto) recentHistory: WatchHistoryItemDto[];
}
