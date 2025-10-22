import { faker } from '@faker-js/faker/.';

import { SubscriptionStatus } from '../../core/enum/subscription-status.enum';
import { Subscription } from '../../persistence/entity/subscription.entity';
import * as Factory from 'factory.ts';
import { planFactory } from './plan.test-factory';

export const subscriptionFactory = Factory.Sync.makeFactory<Partial<Subscription>>({
  id: Factory.each(() => faker.string.uuid()),
  userId: Factory.each(() => faker.string.uuid()),
  planId: Factory.each(() => faker.string.uuid()),
  status: SubscriptionStatus.Active,
  startDate: Factory.each(() => faker.date.recent()),
  endDate: null,
  autoRenew: true,
  createdAt: Factory.each(() => faker.date.recent()),
  updatedAt: Factory.each(() => faker.date.recent()),
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
