import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { AnalyticsContentType } from '../../shared/enum/analytics-content-type.enum';

export const analyticsUserWatchHistoryFactory = Factory.Sync.makeFactory({
  id: Factory.each(() => faker.string.uuid()),
  userId: Factory.each(() => faker.string.uuid()),
  contentId: Factory.each(() => faker.string.uuid()),
  contentType: AnalyticsContentType.MOVIE,
  lastWatchedPositionMs: 0,
  totalWatchTimeMs: 0,
  completionPercentage: 0,
  completed: false,
  watchCount: 1,
  firstWatchedAt: Factory.each(() => faker.date.recent()),
  lastWatchedAt: Factory.each(() => faker.date.recent()),
  createdAt: Factory.each(() => faker.date.recent()),
  updatedAt: Factory.each(() => faker.date.recent()),
  deletedAt: null,
});
