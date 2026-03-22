import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import request from 'supertest';
import { billingConfigFactory, BillingModule } from '../../../billing.module';
import { BillingConfig } from '../../../config';
import { PlanInterval } from '../../../core/enum/plan-interval.enum';
import { DunningStage } from '../../../core/enum/dunning-stage.enum';
import { PaymentStatus } from '../../../core/enum/payment-status.enum';
import { SubscriptionStatus } from '../../../core/enum/subscription-status.enum';
import { DunningManagerService } from '../../../core/service/dunning-manager.service';
import { SubscriptionService } from '../../../core/service/subscription.service';
import { addOnFactory } from '../../factory/add-on.test-factory';
import { invoiceFactory } from '../../factory/invoice.test-factory';
import { planFactory } from '../../factory/plan.test-factory';
import { subscriptionFactory } from '../../factory/subscription.test-factory';

const fakeUserId = faker.string.uuid();
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(
    (
      _token: string,
      _secret: string,
      _options: unknown,
      callback: (err: Error | null, decoded: unknown) => void
    ) => {
      callback(null, { sub: fakeUserId });
    }
  ),
}));

describe('Subscription Lifecycle e2e test', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;
  let subscriptionService: SubscriptionService;
  let dunningManagerService: DunningManagerService;

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
    subscriptionService = module.get(SubscriptionService);
    dunningManagerService = module.get(DunningManagerService);
  });

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2023-01-01'));
  });

  afterEach(async () => {
    await testDbClient(Tables.SubscriptionAddOn).del();
    await testDbClient(Tables.DunningAttempt).del();
    await testDbClient(Tables.Invoice).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.AddOn).del();
    await testDbClient(Tables.Plan).del();
  });

  afterAll(async () => {
    await app.close();
    await module.close();
  });

  describe('Subscription creation with trial period', () => {
    it('creates a Trialing subscription when plan has trialPeriod = 14', async () => {
      const plan = planFactory.build({
        name: 'Premium',
        amount: 20.0,
        currency: 'USD',
        interval: PlanInterval.Month,
        trialPeriod: 14,
      });
      await testDbClient(Tables.Plan).insert(plan);

      const res = await request(app.getHttpServer())
        .post('/subscription')
        .set('Authorization', 'Bearer fake-token')
        .send({ planId: plan.id });

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body.status).toBe(SubscriptionStatus.Trialing);
      expect(res.body.trialEndsAt).toBeDefined();
      expect(res.body.trialEndsAt.slice(0, 10)).toBe('2023-01-15');
    });

    it('creates an Active subscription when plan has trialPeriod = 0', async () => {
      const plan = planFactory.build({
        name: 'Basic',
        amount: 10.0,
        currency: 'USD',
        interval: PlanInterval.Month,
        trialPeriod: 0,
      });
      await testDbClient(Tables.Plan).insert(plan);

      const res = await request(app.getHttpServer())
        .post('/subscription')
        .set('Authorization', 'Bearer fake-token')
        .send({ planId: plan.id });

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body.status).toBe(SubscriptionStatus.Active);
      expect(res.body.trialEndsAt).toBeNull();
    });
  });

  describe('GET /subscription/user/:userId/active', () => {
    it('returns true for a Trialing subscription', async () => {
      const plan = planFactory.build({ trialPeriod: 7 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Trialing,
        trialEndsAt: new Date('2023-01-08'),
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .get(`/subscription/user/${fakeUserId}/active`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.isActive).toBe(true);
    });

    it('returns true for a PastDue subscription', async () => {
      const plan = planFactory.build({ trialPeriod: 0 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.PastDue,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .get(`/subscription/user/${fakeUserId}/active`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.isActive).toBe(true);
    });

    it('returns false for a Suspended subscription', async () => {
      const plan = planFactory.build({ trialPeriod: 0 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Suspended,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .get(`/subscription/user/${fakeUserId}/active`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.isActive).toBe(false);
    });

    it('returns false for a Cancelled subscription', async () => {
      const plan = planFactory.build({ trialPeriod: 0 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Cancelled,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .get(`/subscription/user/${fakeUserId}/active`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.isActive).toBe(false);
    });
  });

  describe('Billing operations on non-billable subscription statuses', () => {
    it('returns 400 on POST /subscription/:id/change-plan for a Suspended subscription', async () => {
      const plan = planFactory.build({ trialPeriod: 0, amount: 10.0 });
      const newPlan = planFactory.build({ trialPeriod: 0, amount: 20.0 });
      await testDbClient(Tables.Plan).insert(plan);
      await testDbClient(Tables.Plan).insert(newPlan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Suspended,
        currentPeriodStart: new Date('2023-01-01'),
        currentPeriodEnd: new Date('2023-02-01'),
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .post(`/subscription/${subscription.id}/change-plan`)
        .set('Authorization', 'Bearer fake-token')
        .send({ newPlanId: newPlan.id });

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 on POST /subscription/:id/add-ons for a Suspended subscription', async () => {
      const plan = planFactory.build({ trialPeriod: 0 });
      await testDbClient(Tables.Plan).insert(plan);

      const addOn = addOnFactory.build({ isActive: true });
      await testDbClient(Tables.AddOn).insert(addOn);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Suspended,
        currentPeriodStart: new Date('2023-01-01'),
        currentPeriodEnd: new Date('2023-02-01'),
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .post(`/subscription/${subscription.id}/add-ons`)
        .set('Authorization', 'Bearer fake-token')
        .send({ addOnId: addOn.id });

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 on POST /subscription/:id/add-ons for a PastDue subscription', async () => {
      const plan = planFactory.build({ trialPeriod: 0 });
      await testDbClient(Tables.Plan).insert(plan);

      const addOn = addOnFactory.build({ isActive: true });
      await testDbClient(Tables.AddOn).insert(addOn);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.PastDue,
        currentPeriodStart: new Date('2023-01-01'),
        currentPeriodEnd: new Date('2023-02-01'),
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .post(`/subscription/${subscription.id}/add-ons`)
        .set('Authorization', 'Bearer fake-token')
        .send({ addOnId: addOn.id });

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /subscription/user/:userId/active — Expired status', () => {
    it('returns false for an Expired subscription', async () => {
      const plan = planFactory.build({ trialPeriod: 0 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Expired,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .get(`/subscription/user/${fakeUserId}/active`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.isActive).toBe(false);
    });
  });

  describe('DELETE /subscription/:id — immediate cancellation', () => {
    it('cancels the subscription immediately and sets canceledAt and endDate', async () => {
      const plan = planFactory.build({ trialPeriod: 0 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Active,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const res = await request(app.getHttpServer())
        .delete(`/subscription/${subscription.id}`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.status).toBe(SubscriptionStatus.Cancelled);

      const [row] = await testDbClient(Tables.Subscription)
        .where({ id: subscription.id })
        .select('status', 'canceledAt', 'endDate');

      expect(row.status).toBe(SubscriptionStatus.Cancelled);
      expect(row.canceledAt).not.toBeNull();
      expect(row.endDate).not.toBeNull();
    });
  });

  describe('Trial expiry processing', () => {
    it('transitions a Trialing subscription to Expired when the trial period has ended', async () => {
      const plan = planFactory.build({ trialPeriod: 7 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Trialing,
        trialEndsAt: new Date('2022-12-31'),
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      await subscriptionService.processTrialExpiry(subscription.id!);

      const [row] = await testDbClient(Tables.Subscription)
        .where({ id: subscription.id })
        .select('status');

      expect(row.status).toBe(SubscriptionStatus.Expired);
    });
  });

  describe('Dunning — retry success reactivates subscription', () => {
    it('transitions PastDue → Active when a dunning retry payment succeeds', async () => {
      const plan = planFactory.build({ trialPeriod: 0, amount: 10.0 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.PastDue,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const invoice = invoiceFactory.build({
        userId: fakeUserId,
        subscriptionId: subscription.id,
        amountDue: 10.0,
      });
      await testDbClient(Tables.Invoice).insert(invoice);

      const attempt = {
        id: faker.string.uuid(),
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        stage: DunningStage.Retry1,
        attemptNumber: 1,
        attemptedAt: new Date('2023-01-01'),
        nextAttemptAt: new Date('2023-01-03'),
        status: PaymentStatus.Pending,
        errorMessage: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        deletedAt: null,
      };
      await testDbClient(Tables.DunningAttempt).insert(attempt);

      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      await dunningManagerService.processDunningAttempt(attempt.id);

      const [row] = await testDbClient(Tables.Subscription)
        .where({ id: subscription.id })
        .select('status');

      expect(row.status).toBe(SubscriptionStatus.Active);

      jest.restoreAllMocks();
    });
  });

  describe('Dunning — exhausted retries suspend subscription', () => {
    it('transitions PastDue → Suspended when the Cancel-stage dunning attempt fails', async () => {
      const plan = planFactory.build({ trialPeriod: 0, amount: 10.0 });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.PastDue,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const invoice = invoiceFactory.build({
        userId: fakeUserId,
        subscriptionId: subscription.id,
        amountDue: 10.0,
      });
      await testDbClient(Tables.Invoice).insert(invoice);

      const attempt = {
        id: faker.string.uuid(),
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        stage: DunningStage.Cancel,
        attemptNumber: 5,
        attemptedAt: new Date('2023-01-15'),
        nextAttemptAt: null,
        status: PaymentStatus.Pending,
        errorMessage: null,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-01-15'),
        deletedAt: null,
      };
      await testDbClient(Tables.DunningAttempt).insert(attempt);

      jest.spyOn(Math, 'random').mockReturnValue(0.1);

      await dunningManagerService.processDunningAttempt(attempt.id);

      const [row] = await testDbClient(Tables.Subscription)
        .where({ id: subscription.id })
        .select('status', 'endDate');

      expect(row.status).toBe(SubscriptionStatus.Suspended);
      expect(row.endDate).not.toBeNull();

      jest.restoreAllMocks();
    });
  });
});
