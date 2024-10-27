import { faker } from '@faker-js/faker/.';
import { PlanInterval, PlanModel } from '@src/module/billing/core/model/plan.model';
import * as Factory from 'factory.ts';

export const planFactory = Factory.Sync.makeFactory<PlanModel>({
  id: faker.string.uuid(),
  name: faker.string.sample(),
  description: faker.string.sample(),
  amount: faker.number.float().toString(),
  currency: faker.finance.currencyCode(),
  interval: PlanInterval.Month,
  trialPeriod: 0,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
});
