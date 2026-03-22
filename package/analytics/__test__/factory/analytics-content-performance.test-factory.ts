import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { AnalyticsContentType } from '../../shared/enum/analytics-content-type.enum';

export const analyticsContentPerformanceFactory = Factory.Sync.makeFactory({
  id: Factory.each(() => faker.string.uuid()),
  contentId: Factory.each(() => faker.string.uuid()),
  contentType: AnalyticsContentType.MOVIE,
  totalViews: 0,
  uniqueViewers: 0,
  totalWatchTimeMs: 0,
  avgCompletionPercentage: 0,
  completionCount: 0,
  lastComputedAt: Factory.each(() => faker.date.recent()),
  createdAt: Factory.each(() => faker.date.recent()),
  updatedAt: Factory.each(() => faker.date.recent()),
  deletedAt: null,
});
