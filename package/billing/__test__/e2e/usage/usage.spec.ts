import { faker } from '@faker-js/faker/.';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import request from 'supertest';
import { billingConfigFactory, BillingModule } from '../../../billing.module';
import { BillingConfig } from '../../../config';
import { planFactory } from '../../factory/plan.test-factory';
import { subscriptionFactory } from '../../factory/subscription.test-factory';
import { usageRecordFactory } from '../../factory/usage-record.test-factory';
import { PlanInterval } from '../../../core/enum/plan-interval.enum';
import { SubscriptionStatus } from '../../../core/enum/subscription-status.enum';
import { UsageType } from '../../../core/enum/usage-type.enum';

const fakeUserId = faker.string.uuid();
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_token: string, _secret: string, _options: unknown, callback: (err: Error | null, decoded: unknown) => void) => {
    callback(null, { sub: fakeUserId });
  }),
}));

describe('Usage e2e test', () => {
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
    await testDbClient(Tables.UsageRecord).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.Plan).del();
  });

  afterAll(async () => {
    await app.close();
    module.close();
  });

  describe('POST /usage', () => {
    it('should record usage successfully', async () => {
      // Arrange: Create plan and subscription
      const plan = planFactory.build({
        name: 'Basic',
        amount: 10.0,
        interval: PlanInterval.Month,
        includedUsageQuotas: { [UsageType.StreamingHours]: 100 },
      });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Active,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      // Act: Record usage
      const res = await request(app.getHttpServer())
        .post('/usage')
        .set('Authorization', `Bearer fake-token`)
        .send({
          subscriptionId: subscription.id,
          usageType: UsageType.StreamingHours,
          quantity: 50.5,
          metadata: { videoId: 'video-123', quality: 'HD' },
        });

      // Assert
      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        subscriptionId: subscription.id,
        usageType: UsageType.StreamingHours,
        quantity: 50.5,
      });

      // Verify usage record was created
      const usageRecord = await testDbClient(Tables.UsageRecord)
        .where({ subscriptionId: subscription.id })
        .first();
      expect(usageRecord).toBeDefined();
      expect(usageRecord.quantity).toBe('50.50'); // PostgreSQL formats decimals with 2 places
      expect(usageRecord.usageType).toBe(UsageType.StreamingHours);
    });
  });

  describe('GET /usage/subscription/:subscriptionId', () => {
    it('should calculate usage summary', async () => {
      // Arrange: Create plan and subscription with usage records
      const plan = planFactory.build({
        name: 'Basic',
        amount: 10.0,
        interval: PlanInterval.Month,
        includedUsageQuotas: { [UsageType.StreamingHours]: 100 },
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

      // Create usage records
      const usageRecord1 = usageRecordFactory.build({
        subscriptionId: subscription.id,
        usageType: UsageType.StreamingHours,
        quantity: 50,
        timestamp: new Date('2023-01-10'),
      });
      const usageRecord2 = usageRecordFactory.build({
        subscriptionId: subscription.id,
        usageType: UsageType.StreamingHours,
        quantity: 75,
        timestamp: new Date('2023-01-15'),
      });
      await testDbClient(Tables.UsageRecord).insert([usageRecord1, usageRecord2]);

      // Set fake timer to a date after the usage records
      jest.setSystemTime(new Date('2023-01-20'));

      // Act: Get usage summary
      const res = await request(app.getHttpServer())
        .get(`/usage/subscription/${subscription.id}`)
        .set('Authorization', `Bearer fake-token`);

      // Assert
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        subscriptionId: subscription.id,
        usageType: UsageType.StreamingHours,
        totalQuantity: 125,
        includedQuota: 100,
        billableQuantity: 25,
        estimatedCost: expect.any(Number),
      });
    });
  });
});

