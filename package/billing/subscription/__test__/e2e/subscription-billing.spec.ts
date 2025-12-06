import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import request from 'supertest';
import { billingConfigFactory, BillingModule } from '../../../billing.module';
import { BillingConfig } from '../../../config';
import { PlanInterval } from '../../../shared/core/enum/plan-interval.enum';
import { SubscriptionStatus } from '../../core/enum/subscription-status.enum';
import { planFactory } from '../factory/plan.test-factory';
import { subscriptionFactory } from '../factory/subscription.test-factory';
import { addOnFactory } from '../factory/add-on.test-factory';

const fakeUserId = faker.string.uuid();
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_token: string, _secret: string, _options: unknown, callback: (err: Error | null, decoded: unknown) => void) => {
    callback(null, { sub: fakeUserId });
  }),
}));

describe('Subscription Billing e2e test', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [billingConfigFactory],
      }),
      BillingModule,
    ]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
    const configService = module.get<ConfigService<BillingConfig>>(ConfigService);
    testDbClient = knex({
      client: 'pg',
      connection: `${configService.get('billing.database.url')}`,
      searchPath: ['public'],
    });
  });

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2023-01-01'));
  });

  afterEach(async () => {
    await testDbClient(Tables.SubscriptionAddOn).del();
    await testDbClient(Tables.InvoiceLineItem).del();
    await testDbClient(Tables.Invoice).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.AddOn).del();
    await testDbClient(Tables.Plan).del();
  });

  afterAll(async () => {
    await app.close();
    module.close();
  });

  describe('POST /subscription/:id/change-plan', () => {
    it('should change plan successfully', async () => {
      // Arrange: Create Basic plan and subscription
      const basicPlan = planFactory.build({
        name: 'Basic',
        description: 'Basic monthly plan',
        currency: 'USD',
        amount: 10.0,
        interval: PlanInterval.Month,
        trialPeriod: 0,
      });
      await testDbClient(Tables.Plan).insert(basicPlan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: basicPlan.id,
        status: SubscriptionStatus.Active,
        currentPeriodStart: new Date('2023-01-01'),
        currentPeriodEnd: new Date('2023-02-01'),
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      // Create Premium plan
      const premiumPlan = planFactory.build({
        name: 'Premium',
        description: 'Premium monthly plan',
        currency: 'USD',
        amount: 20.0,
        interval: PlanInterval.Month,
        trialPeriod: 0,
      });
      await testDbClient(Tables.Plan).insert(premiumPlan);

      // Act: Change to Premium plan
      const res = await request(app.getHttpServer())
        .post(`/subscription/${subscription.id}/change-plan`)
        .set('Authorization', `Bearer fake-token`)
        .send({
          newPlanId: premiumPlan.id,
          chargeImmediately: true,
          keepAddOns: false,
        });

      // Assert
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toMatchObject({
        subscriptionId: subscription.id,
        oldPlanId: basicPlan.id,
        newPlanId: premiumPlan.id,
        invoiceId: expect.any(String),
      });

      // Verify subscription was updated
      const updatedSubscription = await testDbClient(Tables.Subscription)
        .where({ id: subscription.id })
        .first();
      expect(updatedSubscription.planId).toBe(premiumPlan.id);
    });
  });

  describe('POST /subscription/:id/add-ons', () => {
    it('should add add-on successfully', async () => {
      // Arrange: Create plan and subscription
      const plan = planFactory.build({
        name: 'Basic',
        currency: 'USD',
        amount: 10.0,
        interval: PlanInterval.Month,
        allowedAddOns: null,
      });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Active,
        currentPeriodStart: new Date('2023-01-01'),
        currentPeriodEnd: new Date('2023-02-01'),
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      // Create 4K add-on
      const addOn = addOnFactory.build({
        name: '4K Streaming',
        price: 5.0,
        currency: 'USD',
        requiresPlan: null,
      });
      await testDbClient(Tables.AddOn).insert(addOn);

      // Act: Add add-on to subscription
      const res = await request(app.getHttpServer())
        .post(`/subscription/${subscription.id}/add-ons`)
        .set('Authorization', `Bearer fake-token`)
        .send({
          addOnId: addOn.id,
          quantity: 1,
        });

      // Assert
      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        quantity: 1,
        prorationCharge: expect.any(Number),
      });

      // Verify add-on was added
      const subscriptionAddOn = await testDbClient(Tables.SubscriptionAddOn)
        .where({ subscriptionId: subscription.id, addOnId: addOn.id })
        .first();
      expect(subscriptionAddOn).toBeDefined();
      expect(subscriptionAddOn.quantity).toBe(1);
    });
  });
});

