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

describe('ContentLifecycleController – audit trail (e2e)', () => {
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

  async function insertTransitionRecord(opts: {
    contentId: string;
    previousState: PublishingStatus;
    newState: PublishingStatus;
    triggeredBy: string;
    reason?: string | null;
    transitionedAt?: Date;
  }): Promise<void> {
    await testDbClient(Tables.ContentTransition).insert({
      id: randomUUID(),
      contentId: opts.contentId,
      previousState: opts.previousState,
      newState: opts.newState,
      triggeredBy: opts.triggeredBy,
      reason: opts.reason ?? null,
      transitionedAt: opts.transitionedAt ?? new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  function transitionContent(id: string, targetState: PublishingStatus, reason?: string) {
    return request(app.getHttpServer())
      .patch(`/admin/content/${id}/transition`)
      .set('Authorization', 'Bearer fake-token')
      .send({ targetState, ...(reason !== undefined ? { reason } : {}) });
  }

  function getTransitions(id: string) {
    return request(app.getHttpServer())
      .get(`/admin/content/${id}/transitions`)
      .set('Authorization', 'Bearer fake-token');
  }

  // ---------------------------------------------------------------------------
  // GET /admin/content/:id/transitions
  // ---------------------------------------------------------------------------

  describe('GET /admin/content/:id/transitions', () => {
    it('returns full transition history in reverse chronological order', async () => {
      const id = await insertMovie();

      await transitionContent(id, PublishingStatus.REVIEW).expect(HttpStatus.OK);
      await transitionContent(id, PublishingStatus.DRAFT).expect(HttpStatus.OK);

      await getTransitions(id)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(2);

          expect(res.body[0]).toMatchObject({
            previousState: PublishingStatus.REVIEW,
            newState: PublishingStatus.DRAFT,
          });
          expect(res.body[1]).toMatchObject({
            previousState: PublishingStatus.DRAFT,
            newState: PublishingStatus.REVIEW,
          });
        });
    });

    it('returns transition records with all required fields', async () => {
      const id = await insertMovie();

      await transitionContent(id, PublishingStatus.REVIEW).expect(HttpStatus.OK);

      await getTransitions(id)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          const [record] = res.body;
          expect(record).toMatchObject({
            id: expect.any(String),
            previousState: PublishingStatus.DRAFT,
            newState: PublishingStatus.REVIEW,
            triggeredBy: expect.any(String),
            transitionedAt: expect.any(String),
          });
          expect('reason' in record).toBe(true);
        });
    });

    it('records optional rejection reason when transitioning REVIEW → DRAFT', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.REVIEW });
      const rejectionReason = 'Thumbnail quality is too low';

      await transitionContent(id, PublishingStatus.DRAFT, rejectionReason).expect(HttpStatus.OK);

      await getTransitions(id)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({
            previousState: PublishingStatus.REVIEW,
            newState: PublishingStatus.DRAFT,
            reason: rejectionReason,
          });
        });
    });

    it('returns empty array for content with no transitions', async () => {
      const id = await insertMovie();

      await getTransitions(id)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('includes SYSTEM-triggered transitions in audit trail', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.REVIEW });

      await insertTransitionRecord({
        contentId: id,
        previousState: PublishingStatus.REVIEW,
        newState: PublishingStatus.PUBLISHED,
        triggeredBy: 'SYSTEM',
        transitionedAt: new Date(),
      });

      await getTransitions(id)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({
            previousState: PublishingStatus.REVIEW,
            newState: PublishingStatus.PUBLISHED,
            triggeredBy: 'SYSTEM',
          });
        });
    });

    it('returns 404 for non-existent content id', async () => {
      await getTransitions(randomUUID()).expect(HttpStatus.NOT_FOUND);
    });

    it('rejects reason exceeding 500 characters with 400', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.REVIEW });
      const longReason = 'X'.repeat(501);

      await transitionContent(id, PublishingStatus.DRAFT, longReason).expect(HttpStatus.BAD_REQUEST);
    });
  });
});
