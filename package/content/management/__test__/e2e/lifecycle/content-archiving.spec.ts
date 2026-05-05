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

describe('ContentLifecycleController – content archiving (e2e)', () => {
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
    withThumbnail?: boolean;
    genres?: string[];
    ageRecommendation?: number | null;
    description?: string;
  } = {}): Promise<string> {
    const {
      publishingStatus = PublishingStatus.DRAFT,
      withThumbnail = false,
      genres = ['Action'],
      ageRecommendation = 12,
      description = 'A'.repeat(60),
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

  function transition(id: string, targetState: PublishingStatus) {
    return request(app.getHttpServer())
      .patch(`/admin/content/${id}/transition`)
      .set('Authorization', 'Bearer fake-token')
      .send({ targetState });
  }

  // ---------------------------------------------------------------------------
  // PUBLISHED → ARCHIVED
  // ---------------------------------------------------------------------------

  describe('PUBLISHED → ARCHIVED', () => {
    it('archives content and removes it from public catalog', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.PUBLISHED, withThumbnail: true });

      await transition(id, PublishingStatus.ARCHIVED).expect(HttpStatus.OK);

      const row = await testDbClient(Tables.Content).where({ id }).first();
      expect(row.publishingStatus).toBe(PublishingStatus.ARCHIVED);
    });

    it('sets archivedAt and archivedBy fields on archive', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.PUBLISHED });

      await transition(id, PublishingStatus.ARCHIVED).expect(HttpStatus.OK);

      const row = await testDbClient(Tables.Content).where({ id }).first();
      expect(row.archivedAt).not.toBeNull();
      expect(row.archivedBy).not.toBeNull();
    });

    it('archived content appears in admin API with archivedAt and archivedBy fields', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.PUBLISHED });

      await transition(id, PublishingStatus.ARCHIVED).expect(HttpStatus.OK);

      const res = await request(app.getHttpServer())
        .get(`/admin/content/${id}`)
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body.publishingStatus).toBe(PublishingStatus.ARCHIVED);
      expect(res.body.archivedAt).toBeDefined();
      expect(res.body.archivedBy).toBeDefined();
    });

    it('archived content appears in admin listing with status=ARCHIVED', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.PUBLISHED });

      await transition(id, PublishingStatus.ARCHIVED).expect(HttpStatus.OK);

      const res = await request(app.getHttpServer())
        .get('/admin/content?status=ARCHIVED')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      const ids = res.body.map((c: { id: string }) => c.id);
      expect(ids).toContain(id);
    });

    it('preserves content data after archiving', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.PUBLISHED, withThumbnail: true });

      await transition(id, PublishingStatus.ARCHIVED).expect(HttpStatus.OK);

      const row = await testDbClient(Tables.Content).where({ id }).first();
      expect(row.title).toBe('Test Movie');
      expect(row.description.length).toBeGreaterThanOrEqual(60);
      const genres = typeof row.genres === 'string' ? JSON.parse(row.genres) : row.genres;
      expect(genres).toEqual(['Action']);
      expect(row.ageRecommendation).toBe(12);
    });
  });

  // ---------------------------------------------------------------------------
  // ARCHIVED → PUBLISHED (re-gates)
  // ---------------------------------------------------------------------------

  describe('ARCHIVED → PUBLISHED', () => {
    it('republishes archived content successfully when all quality gates pass', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.ARCHIVED, withThumbnail: true });

      const res = await transition(id, PublishingStatus.PUBLISHED).expect(HttpStatus.OK);

      expect(res.body.publishingStatus).toBe(PublishingStatus.PUBLISHED);
    });

    it('clears archivedAt and archivedBy after republication', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.ARCHIVED, withThumbnail: true });

      await transition(id, PublishingStatus.PUBLISHED).expect(HttpStatus.OK);

      const row = await testDbClient(Tables.Content).where({ id }).first();
      expect(row.archivedAt).toBeNull();
      expect(row.archivedBy).toBeNull();
    });

    it('returns 422 when quality gates fail on republication (missing thumbnail)', async () => {
      const id = await insertMovie({
        publishingStatus: PublishingStatus.ARCHIVED,
        withThumbnail: false,
      });

      await transition(id, PublishingStatus.PUBLISHED)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.failures).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ field: 'thumbnail', rule: 'required' }),
            ]),
          );
        });
    });

    it('returns 422 when quality gates fail on republication (missing genres)', async () => {
      const id = await insertMovie({
        publishingStatus: PublishingStatus.ARCHIVED,
        withThumbnail: true,
        genres: [],
      });

      await transition(id, PublishingStatus.PUBLISHED)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.failures).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ field: 'genres', rule: 'required' }),
            ]),
          );
        });
    });
  });
});
