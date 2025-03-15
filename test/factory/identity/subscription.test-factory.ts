import { faker } from '@faker-js/faker/.';

import { planFactory } from '@test/infra/factory/identity/plan.test-factory';
import { SubscriptionStatus } from '@tlc/billing/core/enum/subscription-status.enum';
import { Subscription } from '@tlc/billing/persistence/entity/subscription.entity';
import * as Factory from 'factory.ts';

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
