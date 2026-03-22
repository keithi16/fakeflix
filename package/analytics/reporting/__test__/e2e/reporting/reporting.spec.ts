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
import { analyticsContentPerformanceFactory } from '../../../../__test__/factory/analytics-content-performance.test-factory';
import { analyticsUserWatchHistoryFactory } from '../../../../__test__/factory/analytics-user-watch-history.test-factory';

const fakeUserId = faker.string.uuid();
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(
    (
      _token: string,
      _secret: string,
      _options: unknown,
      callback: (err: Error | null, decoded: unknown) => void
    ) => {
      callback(null, { sub: fakeUserId, role: 'admin' });
    }
  ),
}));

describe('Analytics Admin Reporting E2E', () => {
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
    await testDbClient('AnalyticsContentPerformance').del();
    await testDbClient('AnalyticsUserWatchHistory').del();
    await testDbClient('AnalyticsTrendingContent').del();
    await testDbClient('AnalyticsBingeSession').del();
    cleanAll();
  });

  afterAll(async () => {
    await app.close();
    module.close();
    await testDbClient.destroy();
  });

  describe('GET /analytics/admin/content-performance', () => {
    it('returns paginated content performance list', async () => {
      const perf = analyticsContentPerformanceFactory.build({ totalViews: 50 });
      await testDbClient('AnalyticsContentPerformance').insert(perf);

      const res = await request(app.getHttpServer())
        .get('/analytics/admin/content-performance')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('returns 401 without auth', async () => {
      const res = await request(app.getHttpServer()).get(
        '/analytics/admin/content-performance'
      );
      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 when authenticated user does not have admin role', async () => {
      const verifyMock = jest.requireMock('jsonwebtoken').verify as jest.Mock;
      verifyMock.mockImplementationOnce(
        (
          _token: string,
          _secret: string,
          _options: unknown,
          callback: (err: Error | null, decoded: unknown) => void
        ) => {
          callback(null, { sub: fakeUserId });
        }
      );

      const res = await request(app.getHttpServer())
        .get('/analytics/admin/content-performance')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /analytics/admin/content-performance/top', () => {
    it('returns top content sorted by totalViews', async () => {
      const perf1 = analyticsContentPerformanceFactory.build({ totalViews: 1000 });
      const perf2 = analyticsContentPerformanceFactory.build({ totalViews: 500 });
      await testDbClient('AnalyticsContentPerformance').insert([perf1, perf2]);

      const res = await request(app.getHttpServer())
        .get('/analytics/admin/content-performance/top')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /analytics/admin/content-performance/:contentId', () => {
    it('returns detail for known contentId', async () => {
      const perf = analyticsContentPerformanceFactory.build({ totalViews: 42 });
      await testDbClient('AnalyticsContentPerformance').insert(perf);

      const res = await request(app.getHttpServer())
        .get(`/analytics/admin/content-performance/${perf.contentId}`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.contentId).toBe(perf.contentId);
    });

    it('returns 404 for unknown contentId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/analytics/admin/content-performance/${faker.string.uuid()}`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /analytics/admin/user-engagement', () => {
    it('returns engagement summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/admin/user-engagement')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  describe('GET /analytics/admin/user-engagement/:userId', () => {
    it('returns per-user engagement detail', async () => {
      const historyEntry = analyticsUserWatchHistoryFactory.build({ userId: fakeUserId });
      await testDbClient('AnalyticsUserWatchHistory').insert(historyEntry);

      const res = await request(app.getHttpServer())
        .get(`/analytics/admin/user-engagement/${fakeUserId}`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  describe('GET /analytics/admin/trending', () => {
    it('returns trending list', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/admin/trending')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  describe('GET /analytics/admin/export/content-performance', () => {
    it('returns CSV with correct Content-Type', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/admin/export/content-performance')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.headers['content-type']).toContain('text/csv');
    });
  });
});
