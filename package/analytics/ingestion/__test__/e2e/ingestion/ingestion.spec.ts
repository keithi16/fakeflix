import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import { cleanAll } from 'nock';
import request from 'supertest';
import { analyticsConfigFactory, AnalyticsModule } from '../../../../analytics.module';
import { AnalyticsConfig } from '../../../../config';
import { AnalyticsContentType } from '../../../../shared/enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../../../shared/enum/analytics-event-type.enum';

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

describe('Analytics Ingestion E2E', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({ load: [analyticsConfigFactory] }),
      AnalyticsModule,
    ]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
    const configService = module.get<ConfigService<AnalyticsConfig>>(ConfigService);
    testDbClient = knex({
      client: 'pg',
      connection: configService.get('analytics.database.url'),
      searchPath: ['public'],
    });
  });

  afterEach(async () => {
    await testDbClient('AnalyticsViewEvent').del();
    await testDbClient('AnalyticsHeartbeat').del();
    cleanAll();
  });

  afterAll(async () => {
    await app.close();
    module.close();
    await testDbClient.destroy();
  });

  describe('POST /analytics/events', () => {
    const validEventPayload = () => ({
      contentId: faker.string.uuid(),
      contentType: AnalyticsContentType.MOVIE,
      eventType: AnalyticsEventType.PLAY,
      sessionId: faker.string.uuid(),
      positionMs: 0,
      durationMs: 3600000,
      occurredAt: new Date().toISOString(),
    });

    it('returns 202 and persists the event', async () => {
      const payload = validEventPayload();
      const res = await request(app.getHttpServer())
        .post('/analytics/events')
        .set('Authorization', 'Bearer fake-token')
        .send(payload);

      expect(res.status).toBe(HttpStatus.ACCEPTED);
      expect(res.body).toEqual({ received: true });

      const events = await testDbClient('AnalyticsViewEvent').where({ userId: fakeUserId });
      expect(events).toHaveLength(1);
      expect(events[0].contentId).toBe(payload.contentId);
      expect(events[0].eventType).toBe(payload.eventType);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/analytics/events')
        .send(validEventPayload());

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 400 for invalid DTO (missing required fields)', async () => {
      const res = await request(app.getHttpServer())
        .post('/analytics/events')
        .set('Authorization', 'Bearer fake-token')
        .send({ eventType: 'INVALID' });

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 for invalid enum value', async () => {
      const payload = { ...validEventPayload(), eventType: 'INVALID_EVENT' };
      const res = await request(app.getHttpServer())
        .post('/analytics/events')
        .set('Authorization', 'Bearer fake-token')
        .send(payload);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /analytics/heartbeat', () => {
    const validHeartbeatPayload = () => ({
      heartbeats: [
        {
          contentId: faker.string.uuid(),
          sessionId: faker.string.uuid(),
          positionMs: 1800000,
          durationMs: 3600000,
          occurredAt: new Date().toISOString(),
        },
      ],
    });

    it('returns 202 with count and persists heartbeats', async () => {
      const payload = validHeartbeatPayload();
      const res = await request(app.getHttpServer())
        .post('/analytics/heartbeat')
        .set('Authorization', 'Bearer fake-token')
        .send(payload);

      expect(res.status).toBe(HttpStatus.ACCEPTED);
      expect(res.body).toEqual({ received: true, count: 1 });

      const heartbeats = await testDbClient('AnalyticsHeartbeat').where({ userId: fakeUserId });
      expect(heartbeats).toHaveLength(1);
    });

    it('returns 400 for empty heartbeat array', async () => {
      const res = await request(app.getHttpServer())
        .post('/analytics/heartbeat')
        .set('Authorization', 'Bearer fake-token')
        .send({ heartbeats: [] });

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/analytics/heartbeat')
        .send(validHeartbeatPayload());

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('enqueues COMPLETE job when heartbeat position >= 90%', async () => {
      const res = await request(app.getHttpServer())
        .post('/analytics/heartbeat')
        .set('Authorization', 'Bearer fake-token')
        .send({
          heartbeats: [
            {
              contentId: faker.string.uuid(),
              sessionId: faker.string.uuid(),
              positionMs: 3300000,
              durationMs: 3600000,
              occurredAt: new Date().toISOString(),
            },
          ],
        });

      expect(res.status).toBe(HttpStatus.ACCEPTED);
      expect(res.body.received).toBe(true);
    });
  });
});
