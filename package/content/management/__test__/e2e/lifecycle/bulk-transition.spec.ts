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

describe('ContentLifecycleController – bulk transitions (e2e)', () => {
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

  async function insertMovie(opts: {
    publishingStatus?: PublishingStatus;
    description?: string;
    genres?: string[];
    ageRecommendation?: number | null;
    withThumbnail?: boolean;
  } = {}): Promise<string> {
    const {
      publishingStatus = PublishingStatus.DRAFT,
      description = 'A'.repeat(60),
      genres = ['Action'],
      ageRecommendation = 12,
      withThumbnail = false,
    } = opts;

    const id = randomUUID();
    await testDbClient(Tables.Content).insert({
      id,
      type: 'MOVIE',
      title: 'Test Movie',
      description,
      ageRecommendation,
      releaseDate: new Date('2023-01-01'),
      externalRating: 7.5,
      genres: JSON.stringify(genres),
      publishingStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    if (withThumbnail) {
      const thumbnailId = randomUUID();
      await testDbClient(Tables.Thumbnail).insert({
        id: thumbnailId,
        url: 'test-thumbnail.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      await testDbClient(Tables.Content).where({ id }).update({ thumbnailId });
    }

    return id;
  }

  function bulkTransition(contentIds: string[], targetState: PublishingStatus) {
    return request(app.getHttpServer())
      .post('/admin/content/bulk-transition')
      .set('Authorization', 'Bearer fake-token')
      .send({ contentIds, targetState });
  }

  function getTransitions(id: string) {
    return request(app.getHttpServer())
      .get(`/admin/content/${id}/transitions`)
      .set('Authorization', 'Bearer fake-token');
  }

  // ---------------------------------------------------------------------------
  // POST /admin/content/bulk-transition
  // ---------------------------------------------------------------------------

  describe('POST /admin/content/bulk-transition', () => {
    it('transitions all items successfully when all are valid (DRAFT → REVIEW)', async () => {
      const ids = await Promise.all([insertMovie(), insertMovie(), insertMovie()]);

      await bulkTransition(ids, PublishingStatus.REVIEW)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.succeeded).toHaveLength(3);
          expect(res.body.failed).toHaveLength(0);
          expect(res.body.succeeded.map((s: { id: string }) => s.id).sort()).toEqual([...ids].sort());
          res.body.succeeded.forEach((item: { id: string; newState: string }) => {
            expect(item.newState).toBe(PublishingStatus.REVIEW);
          });
        });
    });

    it('returns partial success when some items have invalid transitions', async () => {
      const validId = await insertMovie({ publishingStatus: PublishingStatus.DRAFT });
      const invalidId = await insertMovie({ publishingStatus: PublishingStatus.PUBLISHED });

      await bulkTransition([validId, invalidId], PublishingStatus.REVIEW)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.succeeded).toHaveLength(1);
          expect(res.body.failed).toHaveLength(1);
          expect(res.body.succeeded[0]).toMatchObject({ id: validId, newState: PublishingStatus.REVIEW });
          expect(res.body.failed[0]).toMatchObject({ id: invalidId, reason: expect.any(String) });
        });
    });

    it('returns partial success when some items fail quality gates (→ PUBLISHED)', async () => {
      const passId = await insertMovie({ publishingStatus: PublishingStatus.REVIEW, withThumbnail: true });
      const failId = await insertMovie({ publishingStatus: PublishingStatus.REVIEW, withThumbnail: false });

      await bulkTransition([passId, failId], PublishingStatus.PUBLISHED)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.succeeded).toHaveLength(1);
          expect(res.body.failed).toHaveLength(1);
          expect(res.body.succeeded[0]).toMatchObject({ id: passId, newState: PublishingStatus.PUBLISHED });
          expect(res.body.failed[0]).toMatchObject({ id: failId, reason: expect.any(String) });
        });
    });

    it('returns 400 when batch exceeds 50 items', async () => {
      const ids = Array.from({ length: 51 }, () => randomUUID());

      await bulkTransition(ids, PublishingStatus.REVIEW).expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 when contentIds is empty', async () => {
      await bulkTransition([], PublishingStatus.REVIEW).expect(HttpStatus.BAD_REQUEST);
    });

    it('each successful bulk transition generates its own audit trail record', async () => {
      const id1 = await insertMovie({ publishingStatus: PublishingStatus.DRAFT });
      const id2 = await insertMovie({ publishingStatus: PublishingStatus.DRAFT });

      await bulkTransition([id1, id2], PublishingStatus.REVIEW).expect(HttpStatus.OK);

      await getTransitions(id1)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({
            previousState: PublishingStatus.DRAFT,
            newState: PublishingStatus.REVIEW,
          });
        });

      await getTransitions(id2)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({
            previousState: PublishingStatus.DRAFT,
            newState: PublishingStatus.REVIEW,
          });
        });
    });

    it('processes duplicate contentIds: first succeeds, second fails (already in target state)', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.DRAFT });

      await bulkTransition([id, id], PublishingStatus.REVIEW)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.succeeded).toHaveLength(1);
          expect(res.body.failed).toHaveLength(1);
          expect(res.body.succeeded[0]).toMatchObject({ id, newState: PublishingStatus.REVIEW });
          expect(res.body.failed[0]).toMatchObject({ id, reason: expect.any(String) });
        });
    });

    it('returns 400 when contentIds is not an array', async () => {
      await request(app.getHttpServer())
        .post('/admin/content/bulk-transition')
        .set('Authorization', 'Bearer fake-token')
        .send({ contentIds: 'not-an-array', targetState: PublishingStatus.REVIEW })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
