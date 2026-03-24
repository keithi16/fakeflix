import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { IngestionReadFacade } from '../../../ingestion/public-api/facade/ingestion-read.facade';
import { AnalyticsContentType } from '../../../shared/enum/analytics-content-type.enum';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';
import { TrendingContentRepository } from '../../persistence/repository/trending-content.repository';

interface ContentMetrics {
  contentId: string;
  contentType: AnalyticsContentType;
  viewCount: number;
  uniqueViewers: Set<string>;
  totalPositionMs: number;
  totalDurationMs: number;
}

@Injectable()
export class TrendingComputationService {
  constructor(
    private readonly ingestionReadFacade: IngestionReadFacade,
    private readonly trendingContentRepository: TrendingContentRepository,
    private readonly logger: AppLogger,
  ) {}

  @Transactional({ connectionName: 'analytics' })
  async computeWindow(windowType: AnalyticsTrendingWindowType): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now);
    const windowEnd = new Date(now);

    if (windowType === AnalyticsTrendingWindowType.DAILY) {
      windowStart.setHours(windowStart.getHours() - 24);
    } else {
      windowStart.setDate(windowStart.getDate() - 7);
    }

    this.logger.log(`Computing trending for ${windowType} from ${windowStart} to ${windowEnd}`);

    const events = await this.ingestionReadFacade.findEventsInWindow(windowStart, windowEnd);

    const metricsMap = new Map<string, ContentMetrics>();

    for (const event of events) {
      const key = event.contentId;
      if (!metricsMap.has(key)) {
        metricsMap.set(key, {
          contentId: event.contentId,
          contentType: event.contentType,
          viewCount: 0,
          uniqueViewers: new Set(),
          totalPositionMs: 0,
          totalDurationMs: 0,
        });
      }

      const metrics = metricsMap.get(key) as ContentMetrics;
      metrics.viewCount += 1;
      metrics.uniqueViewers.add(event.userId);
      metrics.totalPositionMs += Number(event.positionMs);
      metrics.totalDurationMs += Number(event.durationMs);
    }

    const scored = Array.from(metricsMap.values()).map((m) => {
      const avgCompletion =
        m.totalDurationMs > 0 ? m.totalPositionMs / m.totalDurationMs : 0;
      const trendingScore =
        m.viewCount * 0.4 + m.uniqueViewers.size * 0.4 + avgCompletion * 100 * 0.2;
      return { ...m, trendingScore, uniqueViewersCount: m.uniqueViewers.size };
    });

    scored.sort((a, b) => b.trendingScore - a.trendingScore);

    for (let i = 0; i < scored.length; i++) {
      const s = scored[i];
      await this.trendingContentRepository.upsertEntry({
        contentId: s.contentId,
        contentType: s.contentType,
        windowType,
        windowStart,
        windowEnd,
        viewCount: s.viewCount,
        uniqueViewers: s.uniqueViewersCount,
        trendingScore: s.trendingScore,
        rank: i + 1,
        computedAt: now,
      });
    }

    this.logger.log(
      `Trending computation complete for ${windowType}: ${scored.length} entries`,
    );
  }
}
