import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';

import { createNestApp } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { Tables } from '@tlc/shared-lib/test';
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

describe('ContentLifecycleController – admin content listing (e2e)', () => {
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

  async function insertMovie(publishingStatus: PublishingStatus = PublishingStatus.DRAFT): Promise<string> {
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

  // ---------------------------------------------------------------------------
  // GET /admin/content
  // ---------------------------------------------------------------------------

  describe('GET /admin/content', () => {
    it('returns all content across all statuses when no filter is provided', async () => {
      const draftId = await insertMovie(PublishingStatus.DRAFT);
      const reviewId = await insertMovie(PublishingStatus.REVIEW);
      const publishedId = await insertMovie(PublishingStatus.PUBLISHED);
      const archivedId = await insertMovie(PublishingStatus.ARCHIVED);

      const res = await request(app.getHttpServer())
        .get('/admin/content')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveLength(4);
      const ids = res.body.map((c: { id: string }) => c.id);
      expect(ids).toEqual(expect.arrayContaining([draftId, reviewId, publishedId, archivedId]));
    });

    it('returns only DRAFT items when status=DRAFT', async () => {
      const draftId = await insertMovie(PublishingStatus.DRAFT);
      await insertMovie(PublishingStatus.REVIEW);
      await insertMovie(PublishingStatus.PUBLISHED);

      const res = await request(app.getHttpServer())
        .get('/admin/content?status=DRAFT')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(draftId);
      expect(res.body[0].publishingStatus).toBe(PublishingStatus.DRAFT);
    });

    it('returns DRAFT and REVIEW items when status=DRAFT,REVIEW', async () => {
      const draftId = await insertMovie(PublishingStatus.DRAFT);
      const reviewId = await insertMovie(PublishingStatus.REVIEW);
      await insertMovie(PublishingStatus.PUBLISHED);
      await insertMovie(PublishingStatus.ARCHIVED);

      const res = await request(app.getHttpServer())
        .get('/admin/content?status=DRAFT,REVIEW')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveLength(2);
      const ids = res.body.map((c: { id: string }) => c.id);
      expect(ids).toEqual(expect.arrayContaining([draftId, reviewId]));
      for (const item of res.body) {
        expect([PublishingStatus.DRAFT, PublishingStatus.REVIEW]).toContain(item.publishingStatus);
      }
    });

    it('returns an empty array when the status filter matches no items', async () => {
      await insertMovie(PublishingStatus.DRAFT);

      const res = await request(app.getHttpServer())
        .get('/admin/content?status=ARCHIVED')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveLength(0);
    });

    it('ignores unknown status values in the filter', async () => {
      const draftId = await insertMovie(PublishingStatus.DRAFT);

      const res = await request(app.getHttpServer())
        .get('/admin/content?status=DRAFT,UNKNOWN_STATUS')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(draftId);
    });

    it('each item includes id, title, type, and publishingStatus fields', async () => {
      await insertMovie(PublishingStatus.DRAFT);

      const res = await request(app.getHttpServer())
        .get('/admin/content')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        type: expect.any(String),
        publishingStatus: expect.any(String),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /admin/content/:id
  // ---------------------------------------------------------------------------

  describe('GET /admin/content/:id', () => {
    it('returns a single content item with publishingStatus field', async () => {
      const id = await insertMovie(PublishingStatus.REVIEW);

      const res = await request(app.getHttpServer())
        .get(`/admin/content/${id}`)
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        id,
        title: 'Test Movie',
        type: 'MOVIE',
        publishingStatus: PublishingStatus.REVIEW,
      });
    });

    it('returns 404 for a non-existent content id', async () => {
      await request(app.getHttpServer())
        .get(`/admin/content/${randomUUID()}`)
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
