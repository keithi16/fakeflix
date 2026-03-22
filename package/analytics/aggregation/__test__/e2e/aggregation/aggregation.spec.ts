import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
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
import { AnalyticsTrendingWindowType } from '../../../../shared/enum/analytics-trending-window-type.enum';
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
      callback(null, { sub: fakeUserId });
    }
  ),
}));

describe('Analytics Aggregation E2E', () => {
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
    await testDbClient('AnalyticsUserWatchHistory').del();
    await testDbClient('AnalyticsContentPerformance').del();
    await testDbClient('AnalyticsBingeSession').del();
    await testDbClient('AnalyticsTrendingContent').del();
    await testDbClient('AnalyticsViewEvent').del();
    await testDbClient('AnalyticsHeartbeat').del();
    cleanAll();
  });

  afterAll(async () => {
    await app.close();
    module.close();
    await testDbClient.destroy();
  });

  describe('Watch History Aggregation', () => {
    it('creates watch history entry on PLAY event', async () => {
      const contentId = faker.string.uuid();
      const payload = {
        contentId,
        contentType: AnalyticsContentType.MOVIE,
        eventType: AnalyticsEventType.PLAY,
        sessionId: faker.string.uuid(),
        positionMs: 0,
        durationMs: 3600000,
        occurredAt: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/analytics/events')
        .set('Authorization', 'Bearer fake-token')
        .send(payload);

      await new Promise((r) => setTimeout(r, 500));

      const history = await testDbClient('AnalyticsUserWatchHistory').where({
        userId: fakeUserId,
        contentId,
      });
      expect(history).toHaveLength(1);
      expect(history[0].watchCount).toBe(1);
    });

    it('seeds watch history directly for read-model tests', async () => {
      const historyEntry = analyticsUserWatchHistoryFactory.build({
        userId: fakeUserId,
        contentId: faker.string.uuid(),
        lastWatchedPositionMs: 1800000,
        completionPercentage: 50,
      });
      await testDbClient('AnalyticsUserWatchHistory').insert(historyEntry);

      const saved = await testDbClient('AnalyticsUserWatchHistory').where({ id: historyEntry.id });
      expect(saved).toHaveLength(1);
      expect(saved[0].completionPercentage).toBe('50.00');
    });
  });

  describe('Content Performance Aggregation', () => {
    it('seeds content performance and verifies shape', async () => {
      const contentPerf = analyticsContentPerformanceFactory.build({
        totalViews: 100,
        uniqueViewers: 75,
        completionCount: 50,
      });
      await testDbClient('AnalyticsContentPerformance').insert(contentPerf);

      const saved = await testDbClient('AnalyticsContentPerformance').where({
        id: contentPerf.id,
      });
      expect(saved).toHaveLength(1);
      expect(saved[0].totalViews).toBe(100);
      expect(saved[0].uniqueViewers).toBe(75);
    });
  });

  describe('Trending Content', () => {
    it('seeds trending content and verifies retrieval', async () => {
      const contentId = faker.string.uuid();
      const now = new Date();
      const windowStart = new Date(now.getTime() - 24 * 3600000);

      await testDbClient('AnalyticsTrendingContent').insert({
        id: faker.string.uuid(),
        contentId,
        contentType: AnalyticsContentType.MOVIE,
        windowType: AnalyticsTrendingWindowType.DAILY,
        windowStart,
        windowEnd: now,
        viewCount: 100,
        uniqueViewers: 80,
        trendingScore: 92.0,
        rank: 1,
        computedAt: now,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const records = await testDbClient('AnalyticsTrendingContent').where({ contentId });
      expect(records).toHaveLength(1);
      expect(records[0].rank).toBe(1);
    });
  });
});
