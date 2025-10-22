import { faker } from '@faker-js/faker/.';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import request from 'supertest';
import { billingConfigFactory, BillingModule } from '../../../billing.module';
import { BillingConfig } from '../../../config';
import { creditFactory } from '../../factory/credit.test-factory';
import { CreditType } from '../../../core/enum/credit-type.enum';

const fakeUserId = faker.string.uuid();
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_token: string, _secret: string, _options: unknown, callback: (err: Error | null, decoded: unknown) => void) => {
    callback(null, { sub: fakeUserId });
  }),
}));

describe('Credit e2e test', () => {
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
    await testDbClient(Tables.Credit).del();
  });

  afterAll(async () => {
    await app.close();
    module.close();
  });

  describe('GET /credits/user/:userId', () => {
    it('should get user credits', async () => {
      // Arrange: Create credits for user
      const credit1 = creditFactory.build({
        userId: fakeUserId,
        creditType: CreditType.Promotional,
        amount: 10.0,
        remainingAmount: 10.0,
        currency: 'USD',
        description: 'Welcome bonus',
        expiresAt: new Date('2023-12-31'),
      });
      const credit2 = creditFactory.build({
        userId: fakeUserId,
        creditType: CreditType.Refund,
        amount: 5.0,
        remainingAmount: 3.0,
        currency: 'USD',
        description: 'Refund for issue',
        expiresAt: null,
      });
      await testDbClient(Tables.Credit).insert([credit1, credit2]);

      // Act: Get user credits
      const res = await request(app.getHttpServer())
        .get(`/credits/user/${fakeUserId}`)
        .set('Authorization', `Bearer fake-token`);

      // Assert
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        creditType: expect.any(String),
        amount: expect.any(Number),
        remainingAmount: expect.any(Number),
        description: expect.any(String),
      });
    });
  });

  describe('GET /credits/user/:userId/balance', () => {
    it('should get credit balance', async () => {
      // Arrange: Create multiple credits for user
      const credit1 = creditFactory.build({
        userId: fakeUserId,
        creditType: CreditType.Promotional,
        amount: 10.0,
        remainingAmount: 10.0,
        currency: 'USD',
      });
      const credit2 = creditFactory.build({
        userId: fakeUserId,
        creditType: CreditType.Service,
        amount: 5.0,
        remainingAmount: 5.0,
        currency: 'USD',
      });
      const credit3 = creditFactory.build({
        userId: fakeUserId,
        creditType: CreditType.Refund,
        amount: 15.0,
        remainingAmount: 10.0, // $5 already used
        currency: 'USD',
      });
      await testDbClient(Tables.Credit).insert([credit1, credit2, credit3]);

      // Act: Get credit balance
      const res = await request(app.getHttpServer())
        .get(`/credits/user/${fakeUserId}/balance`)
        .set('Authorization', `Bearer fake-token`);

      // Assert
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toMatchObject({
        userId: fakeUserId,
        totalBalance: 25.0, // 10 + 5 + 10 = 25
        currency: 'USD',
        credits: expect.any(Array),
      });
      expect(res.body.credits).toHaveLength(3);
    });
  });
});

