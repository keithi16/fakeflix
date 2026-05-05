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

describe('ContentLifecycleController – scheduled publishing (e2e)', () => {
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
    scheduledPublishAt?: Date | null;
  } = {}): Promise<string> {
    const {
      publishingStatus = PublishingStatus.DRAFT,
      withThumbnail = false,
      scheduledPublishAt = null,
    } = opts;

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
      scheduledPublishAt,
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

  function transition(id: string, targetState: PublishingStatus, extra?: Record<string, unknown>) {
    return request(app.getHttpServer())
      .patch(`/admin/content/${id}/transition`)
      .set('Authorization', 'Bearer fake-token')
      .send({ targetState, ...extra });
  }

  function futureDate(addMinutes: number): string {
    return new Date(Date.now() + addMinutes * 60 * 1000).toISOString();
  }

  // ---------------------------------------------------------------------------
  // Scheduled publishing
  // ---------------------------------------------------------------------------

  describe('PATCH /admin/content/:id/transition – scheduled publishing', () => {
    it('transitions to REVIEW with a valid scheduledPublishAt and stores it', async () => {
      const id = await insertMovie();
      const scheduledPublishAt = futureDate(30);

      const res = await transition(id, PublishingStatus.REVIEW, { scheduledPublishAt })
        .expect(HttpStatus.OK);

      expect(res.body.publishingStatus).toBe(PublishingStatus.REVIEW);
      expect(res.body.scheduledPublishAt).toBeDefined();

      const row = await testDbClient(Tables.Content).where({ id }).first();
      expect(row.scheduledPublishAt).not.toBeNull();
    });

    it('returns 422 when scheduledPublishAt is in the past', async () => {
      const id = await insertMovie();
      const pastDate = new Date(Date.now() - 60 * 1000).toISOString();

      await transition(id, PublishingStatus.REVIEW, { scheduledPublishAt: pastDate })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('returns 422 when scheduledPublishAt is less than 15 minutes in the future', async () => {
      const id = await insertMovie();
      const tooSoonDate = futureDate(5);

      await transition(id, PublishingStatus.REVIEW, { scheduledPublishAt: tooSoonDate })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('DRAFT → REVIEW without scheduledPublishAt succeeds (no scheduling)', async () => {
      const id = await insertMovie();

      const res = await transition(id, PublishingStatus.REVIEW)
        .expect(HttpStatus.OK);

      expect(res.body.publishingStatus).toBe(PublishingStatus.REVIEW);
      expect(res.body.scheduledPublishAt).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // GET /admin/content?status=REVIEW&scheduled=true
  // ---------------------------------------------------------------------------

  describe('GET /admin/content?status=REVIEW&scheduled=true', () => {
    it('returns only REVIEW items that have a scheduled date', async () => {
      const scheduledId = await insertMovie({
        publishingStatus: PublishingStatus.REVIEW,
        scheduledPublishAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      await insertMovie({ publishingStatus: PublishingStatus.REVIEW }); // no schedule

      const res = await request(app.getHttpServer())
        .get('/admin/content?status=REVIEW&scheduled=true')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(scheduledId);
      expect(res.body[0].scheduledPublishAt).toBeDefined();
    });

    it('returns empty array when no scheduled items exist', async () => {
      await insertMovie({ publishingStatus: PublishingStatus.REVIEW });

      const res = await request(app.getHttpServer())
        .get('/admin/content?status=REVIEW&scheduled=true')
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /admin/content/:id/schedule
  // ---------------------------------------------------------------------------

  describe('DELETE /admin/content/:id/schedule', () => {
    it('returns 422 when there is no active schedule for the content', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.REVIEW });

      await request(app.getHttpServer())
        .delete(`/admin/content/${id}/schedule`)
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('cancels an active schedule and content remains in REVIEW', async () => {
      const id = await insertMovie({ publishingStatus: PublishingStatus.DRAFT });
      const scheduledPublishAt = futureDate(60);

      await transition(id, PublishingStatus.REVIEW, { scheduledPublishAt })
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .delete(`/admin/content/${id}/schedule`)
        .set('Authorization', 'Bearer fake-token')
        .expect(HttpStatus.NO_CONTENT);

      const row = await testDbClient(Tables.Content).where({ id }).first();
      expect(row.publishingStatus).toBe(PublishingStatus.REVIEW);
    });
  });
});
