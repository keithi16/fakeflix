import { DefaultModel, WithOptional } from '@src/module/billing/model/default.model';
import { SubscriptionModel } from '@src/module/billing/model/subscription.model';
import { randomUUID } from 'crypto';

export class PlanModel extends DefaultModel {
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  interval: string;
  trialPeriod: number | null = null;
  Subscriptions?: SubscriptionModel[];

  private constructor(data: PlanModel) {
    super();
    Object.assign(this, data);
  }

  static create(
    data: WithOptional<PlanModel, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): PlanModel {
    return new PlanModel({
      ...data,
      id: data.id ? data.id : randomUUID(),
      createdAt: data.createdAt ? data.createdAt : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt : new Date(),
      deletedAt: data.deletedAt ? data.deletedAt : null,
    });
  }

  static createFrom(data: PlanModel): PlanModel {
    return new PlanModel(data);
  }
}
