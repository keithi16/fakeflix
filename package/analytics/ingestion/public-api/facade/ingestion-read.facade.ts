import { Injectable } from '@nestjs/common';
import { AnalyticsViewEvent } from '../../persistence/entity/analytics-view-event.entity';
import { ViewEventRepository } from '../../persistence/repository/view-event.repository';
import { ViewEventData } from '../types/view-event-data';

@Injectable()
export class IngestionReadFacade {
  constructor(private readonly viewEventRepository: ViewEventRepository) {}

  async findEventsInWindow(start: Date, end: Date): Promise<ViewEventData[]> {
    const entities = await this.viewEventRepository.findInWindow(start, end);
    return entities.map(this.toViewEventData);
  }

  async findEventsWithGenresSince(date: Date): Promise<ViewEventData[]> {
    const entities = await this.viewEventRepository.findWithGenresSince(date);
    return entities.map(this.toViewEventData);
  }

  private toViewEventData(entity: AnalyticsViewEvent): ViewEventData {
    return {
      userId: entity.userId,
      contentId: entity.contentId,
      contentType: entity.contentType,
      eventType: entity.eventType,
      sessionId: entity.sessionId,
      positionMs: Number(entity.positionMs),
      durationMs: Number(entity.durationMs),
      metadata: entity.metadata,
      occurredAt: entity.occurredAt,
    };
  }
}
