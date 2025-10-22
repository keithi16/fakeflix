import { faker } from '@faker-js/faker/.';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { randomUUID } from 'crypto';
import knex, { Knex } from 'knex';
import request from 'supertest';
import { billingConfigFactory, BillingModule } from '../../../billing.module';
import { BillingConfig } from '../../../config';
import { PlanInterval } from '../../../core/enum/plan-interval.enum';
import { SubscriptionStatus } from '../../../core/enum/subscription-status.enum';
import { planFactory } from '../../factory/plan.test-factory';

const fakeUserId = faker.string.uuid();
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_token: string, _secret: string, _options: unknown, callback: (err: Error | null, decoded: unknown) => void) => {
    callback(null, { sub: fakeUserId });
  }),
}));

describe('Subscription e2e test', () => {
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
      .set('Authorization', `Bearer fake-token`)
      .send({ planId: plan.id });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
      endDate: null,
      userId: fakeUserId,
      planId: plan.id,
      status: SubscriptionStatus.Active,
      startDate: expect.any(String),
      autoRenew: true,
    });
  });

  it('throws error if the plan does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/subscription')
      .set('Authorization', `Bearer fake-token`)
      .send({ planId: randomUUID() });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });
});
