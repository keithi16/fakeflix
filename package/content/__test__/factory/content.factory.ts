import { faker } from '@faker-js/faker/.';
import { ContentType } from '@tlc/content/core/enum/content-type.enum';
import { Content } from '@tlc/content/persistence/entity/content.entity';

import * as Factory from 'factory.ts';

export const contentFactory = Factory.Sync.makeFactory<Partial<Content>>({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  type: faker.helpers.arrayElement([ContentType.MOVIE, ContentType.TV_SHOW]),
  ageRecommendation: faker.number.int({ min: 0, max: 18 }),
  releaseDate: faker.date.past(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
});
