import { faker } from '@faker-js/faker';
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
import { invoiceFactory } from '../../factory/invoice.test-factory';
import { invoiceLineItemFactory } from '../../factory/invoice-line-item.test-factory';
import { PlanInterval } from '../../../core/enum/plan-interval.enum';
import { SubscriptionStatus } from '../../../core/enum/subscription-status.enum';
import { InvoiceStatus } from '../../../core/enum/invoice-status.enum';

const fakeUserId = faker.string.uuid();
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_token: string, _secret: string, _options: unknown, callback: (err: Error | null, decoded: unknown) => void) => {
    callback(null, { sub: fakeUserId });
  }),
}));

describe('Invoice e2e test', () => {
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
    await testDbClient(Tables.InvoiceLineItem).del();
    await testDbClient(Tables.Invoice).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.Plan).del();
  });

  afterAll(async () => {
    await app.close();
    module.close();
  });

  describe('GET /invoices', () => {
    it('should list user invoices', async () => {
      // Arrange: Create plan, subscription, and invoices
      const plan = planFactory.build({
        name: 'Basic',
        amount: 10.0,
        interval: PlanInterval.Month,
      });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Active,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const invoice1 = invoiceFactory.build({
        userId: fakeUserId,
        subscriptionId: subscription.id,
        status: InvoiceStatus.Paid,
      });
      const invoice2 = invoiceFactory.build({
        userId: fakeUserId,
        subscriptionId: subscription.id,
        status: InvoiceStatus.Open,
      });
      await testDbClient(Tables.Invoice).insert([invoice1, invoice2]);

      // Act: Get user invoices
      const res = await request(app.getHttpServer())
        .get('/invoices')
        .set('Authorization', `Bearer fake-token`);

      // Assert
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        invoiceNumber: expect.any(String),
        status: expect.any(String),
      });
    });
  });

  describe('GET /invoices/:id', () => {
    it('should get invoice by id', async () => {
      // Arrange: Create plan, subscription, invoice with line items
      const plan = planFactory.build({
        name: 'Basic',
        amount: 10.0,
        interval: PlanInterval.Month,
      });
      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: fakeUserId,
        planId: plan.id,
        status: SubscriptionStatus.Active,
      });
      await testDbClient(Tables.Subscription).insert(subscription);

      const invoice = invoiceFactory.build({
        userId: fakeUserId,
        subscriptionId: subscription.id,
        status: InvoiceStatus.Open,
        subtotal: 10.0,
        totalTax: 1.0,
        total: 11.0,
        amountDue: 11.0,
      });
      await testDbClient(Tables.Invoice).insert(invoice);

      const lineItem = invoiceLineItemFactory.build({
        invoiceId: invoice.id,
        description: 'Basic Plan - Monthly',
        amount: 10.0,
        taxAmount: 1.0,
        totalAmount: 11.0,
      });
      await testDbClient(Tables.InvoiceLineItem).insert(lineItem);

      // Act: Get invoice by id
      const res = await request(app.getHttpServer())
        .get(`/invoices/${invoice.id}`)
        .set('Authorization', `Bearer fake-token`);

      // Assert
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toMatchObject({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: InvoiceStatus.Open,
        subtotal: 10.0,
        totalTax: 1.0,
        total: 11.0,
        amountDue: 11.0,
      });
    });

    it('should return 404 for non-existent invoice', async () => {
      const res = await request(app.getHttpServer())
        .get(`/invoices/${faker.string.uuid()}`)
        .set('Authorization', `Bearer fake-token`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});

