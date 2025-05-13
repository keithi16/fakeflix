import { faker } from '@faker-js/faker/.';

import { SubscriptionStatus } from '../../core/enum/subscription-status.enum';
import { Subscription } from '../../persistence/entity/subscription.entity';
import * as Factory from 'factory.ts';
import { planFactory } from './plan.test-factory';

export const subscriptionFactory = Factory.Sync.makeFactory<Partial<Subscription>>({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  planId: faker.string.uuid(),
  status: SubscriptionStatus.Active,
  startDate: faker.date.recent(),
  endDate: null,
  autoRenew: true,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
});

export const subscriptionWithPlanFactory = (
  subscriptionOverrides: Partial<Subscription>
) => {
  const plan = planFactory.build();
  subscriptionFactory.build({
    ...subscriptionOverrides,
    planId: plan.id,
  });
};
