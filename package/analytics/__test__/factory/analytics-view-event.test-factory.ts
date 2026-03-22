import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { AnalyticsContentType } from '../../shared/enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../shared/enum/analytics-event-type.enum';

export const analyticsViewEventFactory = Factory.Sync.makeFactory({
  id: Factory.each(() => faker.string.uuid()),
  userId: Factory.each(() => faker.string.uuid()),
  contentId: Factory.each(() => faker.string.uuid()),
  contentType: AnalyticsContentType.MOVIE,
  eventType: AnalyticsEventType.PLAY,
  sessionId: Factory.each(() => faker.string.uuid()),
  positionMs: 0,
  durationMs: 3600000,
  metadata: null,
  occurredAt: Factory.each(() => faker.date.recent()),
  receivedAt: Factory.each(() => faker.date.recent()),
  createdAt: Factory.each(() => faker.date.recent()),
  updatedAt: Factory.each(() => faker.date.recent()),
  deletedAt: null,
});
