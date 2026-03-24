import { AnalyticsContentType } from '../../../shared/enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../../shared/enum/analytics-event-type.enum';

export interface ViewEventData {
  userId: string;
  contentId: string;
  contentType: AnalyticsContentType;
  eventType: AnalyticsEventType;
  sessionId: string;
  positionMs: number;
  durationMs: number;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
}
