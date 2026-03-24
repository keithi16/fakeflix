import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { AnalyticsContentType } from '../../../shared/enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../../shared/enum/analytics-event-type.enum';
import { AnalyticsHeartbeat } from '../../persistence/entity/analytics-heartbeat.entity';
import { AnalyticsViewEvent } from '../../persistence/entity/analytics-view-event.entity';
import { HeartbeatRepository } from '../../persistence/repository/heartbeat.repository';
import { ViewEventRepository } from '../../persistence/repository/view-event.repository';
import {
  HeartbeatItemDto,
  RecordHeartbeatBatchDto,
} from '../../http/rest/dto/record-heartbeat-batch.dto';
import { RecordPlayerEventDto } from '../../http/rest/dto/record-player-event.dto';
import { AnalyticsEventProcessingJobData } from '../../../shared/contract/event-processing-job.contract';
import { EventProcessingProducer } from '../../queue/producer/event-processing.queue-producer';

const ENQUEUEABLE_EVENTS = new Set([
  AnalyticsEventType.PLAY,
  AnalyticsEventType.STOP,
  AnalyticsEventType.COMPLETE,
]);

const COMPLETION_THRESHOLD = 0.9;

@Injectable()
export class EventIngestionService {
  constructor(
    private readonly viewEventRepository: ViewEventRepository,
    private readonly heartbeatRepository: HeartbeatRepository,
    private readonly eventProcessingProducer: EventProcessingProducer,
    private readonly logger: AppLogger
  ) {}

  @Transactional({ connectionName: 'analytics' })
  async recordEvent(userId: string, dto: RecordPlayerEventDto): Promise<void> {
    const event = new AnalyticsViewEvent({
      userId,
      contentId: dto.contentId,
      contentType: dto.contentType,
      eventType: dto.eventType,
      sessionId: dto.sessionId,
      positionMs: dto.positionMs,
      durationMs: dto.durationMs,
      metadata: dto.metadata ?? null,
      occurredAt: new Date(dto.occurredAt),
      receivedAt: new Date(),
    });

    await this.viewEventRepository.save(event);
    this.logger.log(`Event persisted: ${event.id}`);

    if (ENQUEUEABLE_EVENTS.has(dto.eventType)) {
      const jobData: AnalyticsEventProcessingJobData = {
        userId,
        contentId: dto.contentId,
        contentType: dto.contentType,
        eventType: dto.eventType,
        sessionId: dto.sessionId,
        positionMs: dto.positionMs,
        durationMs: dto.durationMs,
        occurredAt: dto.occurredAt,
        metadata: dto.metadata,
      };
      await this.eventProcessingProducer.enqueueEventProcessing(jobData);
    }
  }

  @Transactional({ connectionName: 'analytics' })
  async recordHeartbeats(
    userId: string,
    dto: RecordHeartbeatBatchDto
  ): Promise<{ count: number }> {
    const heartbeats = dto.heartbeats.map(
      (h: HeartbeatItemDto) =>
        new AnalyticsHeartbeat({
          userId,
          contentId: h.contentId,
          sessionId: h.sessionId,
          positionMs: h.positionMs,
          durationMs: h.durationMs,
          occurredAt: new Date(h.occurredAt),
          receivedAt: new Date(),
        })
    );

    await this.heartbeatRepository.bulkInsert(heartbeats);
    this.logger.log(`Heartbeats persisted: ${heartbeats.length}`);

    const implicitCompletion = dto.heartbeats.find((h: HeartbeatItemDto) => {
      if (h.durationMs === 0) return false;
      return h.positionMs / h.durationMs >= COMPLETION_THRESHOLD;
    });

    if (implicitCompletion) {
      const jobData: AnalyticsEventProcessingJobData = {
        userId,
        contentId: implicitCompletion.contentId,
        contentType: AnalyticsContentType.MOVIE,
        eventType: AnalyticsEventType.COMPLETE,
        sessionId: implicitCompletion.sessionId,
        positionMs: implicitCompletion.positionMs,
        durationMs: implicitCompletion.durationMs,
        occurredAt: implicitCompletion.occurredAt,
      };
      await this.eventProcessingProducer.enqueueEventProcessing(jobData);
      this.logger.log(`Implicit completion detected, queued COMPLETE job`);
    }

    return { count: heartbeats.length };
  }
}
