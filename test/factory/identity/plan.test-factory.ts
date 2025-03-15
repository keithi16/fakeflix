import { faker } from '@faker-js/faker/.';
import { PlanInterval } from '@tlc/billing/core/enum/plan-interval.enum';
import { Plan } from '@tlc/billing/persistence/entity/plan.entity';

import * as Factory from 'factory.ts';

export const planFactory = Factory.Sync.makeFactory<Partial<Plan>>({
  id: faker.string.uuid(),
  name: faker.string.sample(),
  description: faker.string.sample(),
  amount: 10,
  currency: faker.finance.currencyCode(),
  interval: PlanInterval.Month,
  trialPeriod: 0,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
});
