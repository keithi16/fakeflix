import { SubscriptionStatus } from '@src/module/billing/model/subscription.model';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
export function enumToPgEnum<T extends Record<string, any>>(
  myEnum: T
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum).map((value: any) => `${value}`) as any;
}
export const status = pgEnum('status', enumToPgEnum(SubscriptionStatus));

export const plansTable = pgTable('Plan', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  interval: varchar('interval', { length: 10 }).notNull(),
  trialPeriod: integer('trial_period'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const subscriptionsTable = pgTable('Subscription', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('userId', { length: 36 }).notNull(),
  planId: varchar('planId', { length: 36 })
    .notNull()
    .references(() => plansTable.id),
  status: status('status').notNull().default(SubscriptionStatus.Inactive),
  startDate: timestamp('start_date').notNull().defaultNow(),
  endDate: timestamp('end_date'),
  autoRenew: boolean('auto_renew').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
