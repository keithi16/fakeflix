import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { AnalyticsEventProcessingJobData } from '../../../shared/contract/event-processing-job.contract';
import { AnalyticsContentType } from '../../../shared/enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../../shared/enum/analytics-event-type.enum';
import { AnalyticsUserWatchHistory } from '../../persistence/entity/analytics-user-watch-history.entity';
import { UserWatchHistoryRepository } from '../../persistence/repository/user-watch-history.repository';

@Injectable()
export class WatchHistoryAggregationService {
  constructor(
    private readonly watchHistoryRepository: UserWatchHistoryRepository,
    private readonly logger: AppLogger
  ) {}

  @Transactional({ connectionName: 'analytics' })
  async processEvent(event: AnalyticsEventProcessingJobData): Promise<void> {
    const existing = await this.watchHistoryRepository.findByUserAndContent(
      event.userId,
      event.contentId
    );

    const now = new Date();

    if (!existing) {
      if (event.eventType !== AnalyticsEventType.PLAY) return;

      const entry = new AnalyticsUserWatchHistory({
        userId: event.userId,
        contentId: event.contentId,
        contentType: event.contentType as AnalyticsContentType,
        lastWatchedPositionMs: event.positionMs,
        totalWatchTimeMs: 0,
        completionPercentage: this.calcCompletion(event.positionMs, event.durationMs),
        completed: false,
        watchCount: 1,
        firstWatchedAt: now,
        lastWatchedAt: now,
      });
      await this.watchHistoryRepository.save(entry);
      this.logger.log(`WatchHistory created for user ${event.userId}, content ${event.contentId}`);
      return;
    }

    switch (event.eventType) {
      case AnalyticsEventType.PLAY:
        existing.watchCount += 1;
        existing.lastWatchedAt = now;
        break;

      case AnalyticsEventType.STOP:
        existing.lastWatchedPositionMs = event.positionMs;
        existing.totalWatchTimeMs = Number(existing.totalWatchTimeMs) + event.positionMs;
        existing.completionPercentage = this.calcCompletion(event.positionMs, event.durationMs);
        existing.lastWatchedAt = now;
        break;

      case AnalyticsEventType.COMPLETE:
        existing.lastWatchedPositionMs = event.positionMs;
        existing.totalWatchTimeMs = Number(existing.totalWatchTimeMs) + event.positionMs;
        existing.completionPercentage = 100;
        existing.completed = true;
        existing.lastWatchedAt = now;
        break;

      default:
        return;
    }

    await this.watchHistoryRepository.save(existing);
    this.logger.log(`WatchHistory updated for user ${event.userId}, event ${event.eventType}`);
  }

  private calcCompletion(positionMs: number, durationMs: number): number {
    if (durationMs === 0) return 0;
    return Math.min(100, (positionMs / durationMs) * 100);
  }
}
