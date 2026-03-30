import { Inject, Injectable } from '@nestjs/common';
import { AnalyticsApi } from '@tlc/shared-module/public-api';
import { Transactional } from 'typeorm-transactional';
import { ContinueWatchingDismissRepository } from '../../persistence/repository/continue-watching-dismiss.repository';

export interface ContinueWatchingItem {
  contentId: string;
  contentType: string;
  completionPercentage: number;
  resumePositionMs: number;
  lastWatchedAt: Date;
}

@Injectable()
export class ContinueWatchingService {
  constructor(
    @Inject(AnalyticsApi) private readonly analyticsApi: AnalyticsApi,
    private readonly dismissRepository: ContinueWatchingDismissRepository,
  ) {}

  async getForUser(userId: string): Promise<ContinueWatchingItem[]> {
    try {
      const [history, dismissed] = await Promise.all([
        this.analyticsApi.getUserWatchHistory(userId),
        this.dismissRepository.findByUserId(userId),
      ]);

      const dismissedSet = new Set(dismissed.map((d) => d.contentId));

      const partial = history
        .filter((h) => h.completionPercentage > 5 && h.completionPercentage < 90)
        .filter((h) => !dismissedSet.has(h.contentId))
        .sort((a, b) => b.lastWatchedAt.getTime() - a.lastWatchedAt.getTime())
        .slice(0, 20);

      const enriched = await Promise.all(
        partial.map(async (h) => {
          const resume = await this.analyticsApi.getUserResumePosition(userId, h.contentId);
          return {
            contentId: h.contentId,
            contentType: h.contentType,
            completionPercentage: h.completionPercentage,
            resumePositionMs: resume?.positionMs ?? 0,
            lastWatchedAt: h.lastWatchedAt,
          };
        }),
      );

      return enriched;
    } catch {
      return [];
    }
  }

  @Transactional({ connectionName: 'recommendations' })
  async dismissItem(userId: string, contentId: string): Promise<void> {
    await this.dismissRepository.dismiss(userId, contentId);
  }
}
