import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';

export const preComputedRecommendationFactory = Factory.Sync.makeFactory({
  id: Factory.each(() => faker.string.uuid()),
  userId: Factory.each(() => faker.string.uuid()),
  contentId: Factory.each(() => faker.string.uuid()),
  score: Factory.each(() => faker.number.float({ min: 0.1, max: 100, fractionDigits: 4 })),
  rank: Factory.each(() => faker.number.int({ min: 1, max: 20 })),
  matchedGenres: Factory.each(() => JSON.stringify([faker.word.sample()])),
  computedAt: Factory.each(() => faker.date.recent()),
  createdAt: Factory.each(() => faker.date.recent()),
  updatedAt: Factory.each(() => faker.date.recent()),
  deletedAt: null,
});
