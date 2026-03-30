import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';

export const continueWatchingDismissFactory = Factory.Sync.makeFactory({
  id: Factory.each(() => faker.string.uuid()),
  userId: Factory.each(() => faker.string.uuid()),
  contentId: Factory.each(() => faker.string.uuid()),
  dismissedAt: Factory.each(() => faker.date.recent()),
  createdAt: Factory.each(() => faker.date.recent()),
  updatedAt: Factory.each(() => faker.date.recent()),
  deletedAt: null,
});
