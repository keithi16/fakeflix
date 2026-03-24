import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { AnalyticsEventProcessingJobData } from '../../../shared/contract/event-processing-job.contract';
import { AnalyticsContentType } from '../../../shared/enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../../shared/enum/analytics-event-type.enum';
import { AnalyticsContentPerformance } from '../../persistence/entity/analytics-content-performance.entity';
import { ContentPerformanceRepository } from '../../persistence/repository/content-performance.repository';

@Injectable()
export class ContentPerformanceAggregationService {
  constructor(
    private readonly contentPerformanceRepository: ContentPerformanceRepository,
    private readonly logger: AppLogger
  ) {}

  @Transactional({ connectionName: 'analytics' })
  async processEvent(event: AnalyticsEventProcessingJobData): Promise<void> {
    let entry = await this.contentPerformanceRepository.findByContentId(event.contentId);

    if (!entry) {
      entry = new AnalyticsContentPerformance({
        contentId: event.contentId,
        contentType: event.contentType as AnalyticsContentType,
        totalViews: 0,
        uniqueViewers: 0,
        totalWatchTimeMs: 0,
        avgCompletionPercentage: 0,
        completionCount: 0,
        lastComputedAt: new Date(),
      });
    }

    switch (event.eventType) {
      case AnalyticsEventType.PLAY:
        entry.totalViews += 1;
        entry.lastComputedAt = new Date();
        break;

      case AnalyticsEventType.STOP:
        entry.totalWatchTimeMs = Number(entry.totalWatchTimeMs) + event.positionMs;
        entry.lastComputedAt = new Date();
        break;

      case AnalyticsEventType.COMPLETE: {
        const prevCount = entry.completionCount;
        entry.completionCount += 1;
        entry.totalWatchTimeMs = Number(entry.totalWatchTimeMs) + event.positionMs;
        entry.lastComputedAt = new Date();
        const newCompletion = this.calcCompletion(event.positionMs, event.durationMs);
        entry.avgCompletionPercentage =
          (Number(entry.avgCompletionPercentage) * prevCount + newCompletion) / entry.completionCount;
        break;
      }

      default:
        return;
    }

    await this.contentPerformanceRepository.save(entry);
    this.logger.log(
      `ContentPerformance updated for content ${event.contentId}, event ${event.eventType}`
    );
  }

  private calcCompletion(positionMs: number, durationMs: number): number {
    if (durationMs === 0) return 0;
    return Math.min(100, (positionMs / durationMs) * 100);
  }
}
