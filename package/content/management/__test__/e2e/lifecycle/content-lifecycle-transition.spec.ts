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

describe('ContentLifecycleController (e2e)', () => {
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

  async function insertTvShow(opts: {
    publishingStatus?: PublishingStatus;
    description?: string;
    genres?: string[];
    ageRecommendation?: number | null;
    withThumbnail?: boolean;
    withEpisode?: boolean;
  } = {}): Promise<string> {
    const {
      publishingStatus = PublishingStatus.DRAFT,
      description = 'A'.repeat(60),
      genres = ['Drama'],
      ageRecommendation = 12,
      withThumbnail = false,
      withEpisode = false,
    } = opts;

    const id = randomUUID();
    await testDbClient(Tables.Content).insert({
      id,
      type: 'TV_SHOW',
      title: 'Test TV Show',
      description,
      ageRecommendation,
      releaseDate: new Date('2023-01-01'),
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

    if (withEpisode) {
      await testDbClient(Tables.Episode).insert({
        id: randomUUID(),
        title: 'Episode 1',
        description: 'First episode',
        season: 1,
        number: 1,
        tvShowId: id,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
    }

    return id;
  }

  function transition(id: string, targetState: PublishingStatus, reason?: string) {
    return request(app.getHttpServer())
      .patch(`/admin/content/${id}/transition`)
      .set('Authorization', 'Bearer fake-token')
      .send({ targetState, ...(reason ? { reason } : {}) });
  }

  // ---------------------------------------------------------------------------
  // Happy path – state transitions
  // ---------------------------------------------------------------------------

  describe('PATCH /admin/content/:id/transition', () => {
    it('DRAFT → REVIEW succeeds', async () => {
      const id = await insertMovie();

      await transition(id, PublishingStatus.REVIEW)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({ id, publishingStatus: PublishingStatus.REVIEW });
        });
    });

    it('REVIEW → PUBLISHED succeeds when all quality gates pass (movie)', async () => {
      const id = await insertMovie({
        publishingStatus: PublishingStatus.REVIEW,
        withThumbnail: true,
      });

      await transition(id, PublishingStatus.PUBLISHED)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({ id, publishingStatus: PublishingStatus.PUBLISHED });
        });
    });

    it('REVIEW → DRAFT succeeds', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.REVIEW });

      await transition(id, PublishingStatus.DRAFT)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({ id, publishingStatus: PublishingStatus.DRAFT });
        });
    });

    it('PUBLISHED → ARCHIVED succeeds', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.PUBLISHED });

      await transition(id, PublishingStatus.ARCHIVED)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({ id, publishingStatus: PublishingStatus.ARCHIVED });
        });
    });

    it('ARCHIVED → PUBLISHED re-runs quality gates and succeeds when all pass', async () => {
      const id = await insertMovie({
        publishingStatus: PublishingStatus.ARCHIVED,
        withThumbnail: true,
      });

      await transition(id, PublishingStatus.PUBLISHED)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({ id, publishingStatus: PublishingStatus.PUBLISHED });
        });
    });

    // ---------------------------------------------------------------------------
    // Quality gate failures
    // ---------------------------------------------------------------------------

    it('REVIEW → PUBLISHED fails (422) when thumbnail is missing', async () => {
      const id = await insertMovie({
        publishingStatus: PublishingStatus.REVIEW,
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

    it('REVIEW → PUBLISHED fails (422) when description is too short', async () => {
      const id = await insertMovie({
        publishingStatus: PublishingStatus.REVIEW,
        withThumbnail: true,
        description: 'Too short',
      });

      await transition(id, PublishingStatus.PUBLISHED)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.failures).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ field: 'description', rule: 'minLength' }),
            ]),
          );
        });
    });

    it('REVIEW → PUBLISHED fails (422) when genres are missing', async () => {
      const id = await insertMovie({
        publishingStatus: PublishingStatus.REVIEW,
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

    it('REVIEW → PUBLISHED fails (422) when ageRecommendation is null', async () => {
      const id = await insertMovie({
        publishingStatus: PublishingStatus.REVIEW,
        withThumbnail: true,
        ageRecommendation: null,
      });

      await transition(id, PublishingStatus.PUBLISHED)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.failures).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ field: 'ageRecommendation', rule: 'required' }),
            ]),
          );
        });
    });

    it('TV_SHOW REVIEW → PUBLISHED fails (422) when there are no episodes', async () => {
      const id = await insertTvShow({
        publishingStatus: PublishingStatus.REVIEW,
        withThumbnail: true,
        withEpisode: false,
      });

      await transition(id, PublishingStatus.PUBLISHED)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.failures).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ field: 'episodes', rule: 'required' }),
            ]),
          );
        });
    });

    // ---------------------------------------------------------------------------
    // Invalid transition
    // ---------------------------------------------------------------------------

    it('DRAFT → PUBLISHED fails (422) with invalid transition error', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.DRAFT });

      await transition(id, PublishingStatus.PUBLISHED).expect(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    // ---------------------------------------------------------------------------
    // Not found
    // ---------------------------------------------------------------------------

    it('returns 404 for a non-existent content id', async () => {
      await transition(randomUUID(), PublishingStatus.REVIEW).expect(HttpStatus.NOT_FOUND);
    });
  });
});
