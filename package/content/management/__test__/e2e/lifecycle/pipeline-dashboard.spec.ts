import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';

import { createNestApp } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { Tables } from '@tlc/shared-lib/test/enum/tables.enum';
import { knex, type Knex } from 'knex';
import { cleanAll } from 'nock';
import request from 'supertest';
import { cleanUpContentDatabase } from '../../../../__test__/helper/content-db.test-helper';
import { ContentConfig, contentConfigFactory } from '../../../../config';
import { ContentManagementModule } from '../../../content-management.module';
import { PublishingStatus } from '../../../../shared/core/enum/publishing-status.enum';

const fakeUserId = randomUUID();
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(
    (_token: string, _secret: string, _options: unknown, callback: (err: Error | null, decoded: unknown) => void) => {
      callback(null, { sub: fakeUserId, role: 'admin' });
    },
  ),
}));

describe('PipelineDashboardController (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let testDbClient: Knex;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      ContentManagementModule,
    ]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
    const configService = module.get<ConfigService<ContentConfig>>(ConfigService);
    testDbClient = knex({
      client: 'pg',
      connection: `${configService.get('content.database.url')}`,
      searchPath: ['public'],
    });
  });

  beforeEach(async () => {
    await testDbClient(Tables.ContentTransition).del();
    await cleanUpContentDatabase(testDbClient);
  });

  afterEach(async () => {
    await testDbClient(Tables.ContentTransition).del();
    await cleanUpContentDatabase(testDbClient);
    cleanAll();
  });

  afterAll(async () => {
    await app.close();
    await module.close();
  }, 30000);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async function insertMovie(publishingStatus: PublishingStatus): Promise<string> {
    const id = randomUUID();
    await testDbClient(Tables.Content).insert({
      id,
      type: 'MOVIE',
      title: 'Test Movie',
      description: 'A'.repeat(60),
      ageRecommendation: 12,
      releaseDate: new Date('2023-01-01'),
      externalRating: 7.5,
      genres: JSON.stringify(['Action']),
      publishingStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    return id;
  }

  async function insertTvShow(publishingStatus: PublishingStatus): Promise<string> {
    const id = randomUUID();
    await testDbClient(Tables.Content).insert({
      id,
      type: 'TV_SHOW',
      title: 'Test TV Show',
      description: 'A'.repeat(60),
      ageRecommendation: 12,
      releaseDate: new Date('2023-01-01'),
      genres: JSON.stringify(['Drama']),
      publishingStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    return id;
  }

  async function insertTransition(contentId: string, prev: PublishingStatus, next: PublishingStatus, triggeredBy = 'user'): Promise<void> {
    await testDbClient(Tables.ContentTransition).insert({
      id: randomUUID(),
      contentId,
      previousState: prev,
      newState: next,
      triggeredBy,
      reason: null,
      transitionedAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // GET /admin/content/pipeline/summary
  // ---------------------------------------------------------------------------

  describe('GET /admin/content/pipeline/summary', () => {
    it('returns all-zero counts when the database is empty', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/summary')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ draft: 0, review: 0, published: 0, archived: 0 });
    });

    it('returns correct counts per state', async () => {
      await insertMovie(PublishingStatus.DRAFT);
      await insertMovie(PublishingStatus.DRAFT);
      await insertMovie(PublishingStatus.REVIEW);
      await insertMovie(PublishingStatus.PUBLISHED);
      await insertMovie(PublishingStatus.ARCHIVED);

      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/summary')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ draft: 2, review: 1, published: 1, archived: 1 });
    });

    it('returns only non-zero states when some states have no content', async () => {
      await insertMovie(PublishingStatus.PUBLISHED);
      await insertMovie(PublishingStatus.PUBLISHED);

      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/summary')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ draft: 0, review: 0, published: 2, archived: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /admin/content/pipeline/summary?breakdown=contentType
  // ---------------------------------------------------------------------------

  describe('GET /admin/content/pipeline/summary?breakdown=contentType', () => {
    it('returns totals and breakdown by content type', async () => {
      await insertMovie(PublishingStatus.DRAFT);
      await insertMovie(PublishingStatus.PUBLISHED);
      await insertTvShow(PublishingStatus.REVIEW);
      await insertTvShow(PublishingStatus.PUBLISHED);

      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/summary?breakdown=contentType')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body.draft).toBe(1);
      expect(res.body.review).toBe(1);
      expect(res.body.published).toBe(2);
      expect(res.body.archived).toBe(0);

      expect(res.body.breakdown.MOVIE).toBeDefined();
      expect(res.body.breakdown.MOVIE.draft).toBe(1);
      expect(res.body.breakdown.MOVIE.published).toBe(1);

      expect(res.body.breakdown.TV_SHOW).toBeDefined();
      expect(res.body.breakdown.TV_SHOW.review).toBe(1);
      expect(res.body.breakdown.TV_SHOW.published).toBe(1);
    });

    it('returns zero breakdown counts when database is empty', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/summary?breakdown=contentType')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ draft: 0, review: 0, published: 0, archived: 0, breakdown: {} });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /admin/content/pipeline/recent-transitions
  // ---------------------------------------------------------------------------

  describe('GET /admin/content/pipeline/recent-transitions', () => {
    it('returns an empty array when no transitions exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/recent-transitions')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual([]);
    });

    it('returns transitions ordered by timestamp descending', async () => {
      const movieId = await insertMovie(PublishingStatus.REVIEW);

      await insertTransition(movieId, PublishingStatus.DRAFT, PublishingStatus.REVIEW);
      await new Promise(r => setTimeout(r, 10));
      await insertTransition(movieId, PublishingStatus.REVIEW, PublishingStatus.PUBLISHED);

      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/recent-transitions')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const timestamps = res.body.map((t: { timestamp: string }) => new Date(t.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    });

    it('returns transition objects with required fields', async () => {
      const movieId = await insertMovie(PublishingStatus.REVIEW);
      await insertTransition(movieId, PublishingStatus.DRAFT, PublishingStatus.REVIEW, 'admin-user');

      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/recent-transitions')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const transition = res.body.find((t: { contentId: string }) => t.contentId === movieId);
      expect(transition).toBeDefined();
      expect(transition).toMatchObject({
        contentId: movieId,
        previousState: PublishingStatus.DRAFT,
        newState: PublishingStatus.REVIEW,
        triggeredBy: 'admin-user',
        timestamp: expect.any(String),
      });
    });

    it('limits results to 50 most recent transitions', async () => {
      const movieId = await insertMovie(PublishingStatus.DRAFT);

      for (let i = 0; i < 55; i++) {
        await insertTransition(movieId, PublishingStatus.DRAFT, PublishingStatus.REVIEW);
      }

      const res = await request(app.getHttpServer())
        .get('/admin/content/pipeline/recent-transitions')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body.length).toBeLessThanOrEqual(50);
    });
  });
});
