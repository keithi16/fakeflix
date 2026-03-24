import { Injectable } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { AnalyticsConfig } from '../../../config';
import { AnalyticsBingeSession } from '../../persistence/entity/analytics-binge-session.entity';
import { BingeSessionRepository } from '../../persistence/repository/binge-session.repository';
import { UserWatchHistoryRepository } from '../../persistence/repository/user-watch-history.repository';

@Injectable()
export class BingeDetectionService {
  constructor(
    private readonly bingeSessionRepository: BingeSessionRepository,
    private readonly watchHistoryRepository: UserWatchHistoryRepository,
    private readonly configService: ConfigService<AnalyticsConfig>,
    private readonly logger: AppLogger
  ) {}

  @Transactional({ connectionName: 'analytics' })
  async evaluateBinge(
    userId: string,
    seriesContentId: string,
    occurredAt: string
  ): Promise<void> {
    const eventTime = new Date(occurredAt);
    const bingeGapMinutes = this.configService.get('analytics.thresholds.bingeGapMinutes') ?? 30;
    const gapMs = bingeGapMinutes * 60 * 1000;

    const activeSession = await this.bingeSessionRepository.findActiveSessionForUser(
      userId,
      seriesContentId
    );

    if (activeSession) {
      const lastActivity = activeSession.updatedAt || activeSession.startedAt;
      const timeSinceLast = eventTime.getTime() - lastActivity.getTime();

      if (timeSinceLast > gapMs) {
        activeSession.endedAt = new Date(lastActivity.getTime() + gapMs);
        await this.bingeSessionRepository.save(activeSession);
        this.logger.log(`Closed binge session ${activeSession.id} for user ${userId}`);

        await this.createOrExtendSession(userId, seriesContentId, eventTime);
      } else {
        activeSession.episodeCount += 1;
        activeSession.totalWatchTimeMs = Number(activeSession.totalWatchTimeMs) + timeSinceLast;
        await this.bingeSessionRepository.save(activeSession);
        this.logger.log(`Extended binge session ${activeSession.id} for user ${userId}`);
      }
    } else {
      await this.createOrExtendSession(userId, seriesContentId, eventTime);
    }
  }

  private async createOrExtendSession(
    userId: string,
    seriesContentId: string,
    startedAt: Date
  ): Promise<void> {
    const newSession = new AnalyticsBingeSession({
      userId,
      seriesContentId,
      episodeCount: 1,
      totalWatchTimeMs: 0,
      startedAt,
      endedAt: null,
    });
    await this.bingeSessionRepository.save(newSession);
    this.logger.log(`Created new binge session for user ${userId}, series ${seriesContentId}`);
  }
}
