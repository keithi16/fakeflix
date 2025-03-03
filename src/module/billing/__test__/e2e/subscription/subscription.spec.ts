import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { BillingModule } from '@src/module/billing/billing.module';
import { PlanInterval } from '@src/module/billing/core/enum/plan-interval.enum';
import { SubscriptionStatus } from '@src/module/billing/core/enum/subscription-status.enum';
import { Tables } from '@testInfra/enum/tables.enum';
import { planFactory } from '@testInfra/factory/identity/plan.test-factory';
import { testDbClient } from '@testInfra/knex.database';
import { createNestApp } from '@testInfra/test-e2e.setup';
import { randomUUID } from 'crypto';
import request from 'supertest';

describe('Subscription e2e test', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([BillingModule]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
  });

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2023-01-01'));
  });

  afterEach(async () => {
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.Plan).del();
  });

  afterAll(async () => {
    //TODO move it to be shared
    await app.close();
    module.close();
  });

  it('creates a subscription', async () => {
    const plan = planFactory.build({
      name: 'Basic',
      description: 'Basic montly plan',
      currency: 'USD',
      amount: 10.0,
      interval: PlanInterval.Month,
      trialPeriod: 7,
    });
    await testDbClient(Tables.Plan).insert(plan);
    const res = await request(app.getHttpServer())
      .post('/subscription')
      .send({ planId: plan.id });
    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
      endDate: null,
      userId: 'user-id',
      planId: plan.id,
      status: SubscriptionStatus.Active,
      startDate: expect.any(String),
      autoRenew: true,
    });
  });

  it('throws error if the plan does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/subscription')
      .send({ planId: randomUUID() });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });
});
