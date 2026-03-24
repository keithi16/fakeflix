export interface AnalyticsEventProcessingJobData {
  userId: string;
  contentId: string;
  contentType: string;
  eventType: string;
  sessionId: string;
  positionMs: number;
  durationMs: number;
  occurredAt: string;
  metadata?: Record<string, unknown> | null;
}
