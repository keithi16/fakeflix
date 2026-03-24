import { faker } from '@faker-js/faker';
import { MovieContent } from '../../shared/core';
import { ContentType } from '../../shared/core/enum/content-type.enum';

import * as Factory from 'factory.ts';

export const movieFactory = Factory.Sync.makeFactory<Partial<MovieContent>>({
  id: faker.string.uuid(),
  type: ContentType.MOVIE,
  externalRating: faker.number.float({ min: 0, max: 10 }),
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  ageRecommendation: faker.number.int({ min: 0, max: 18 }),
  releaseDate: faker.date.recent(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
});
