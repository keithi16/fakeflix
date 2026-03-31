import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';

import { createNestApp } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { Tables } from '@tlc/shared-lib/test/enum/tables.enum';
import { knex, type Knex } from 'knex';
import { cleanAll } from 'nock';
import { ContentConfig, contentConfigFactory } from '../../../../config';
import { ContentManagementModule } from '../../../content-management.module';
import { PublishingStatus } from '../../../../shared/core/enum/publishing-status.enum';
import { ScheduledPublishConsumer } from '../../../queue/consumer/scheduled-publish.queue-consumer';
import { cleanUpContentDatabase } from '../../../../__test__/helper/content-db.test-helper';

describe('ScheduledPublishConsumer (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let testDbClient: Knex;
  let consumer: ScheduledPublishConsumer;

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
    consumer = module.get(ScheduledPublishConsumer);
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

  function fakeJob(contentId: string) {
    return { data: { contentId } } as any;
  }

  async function insertMovie(opts: {
    publishingStatus?: PublishingStatus;
    withThumbnail?: boolean;
  } = {}): Promise<string> {
    const { publishingStatus = PublishingStatus.REVIEW, withThumbnail = true } = opts;
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

  describe('process()', () => {
    it('publishes REVIEW content when all quality gates pass', async () => {
      const contentId = await insertMovie({ publishingStatus: PublishingStatus.REVIEW, withThumbnail: true });

      await consumer.process(fakeJob(contentId));

      const row = await testDbClient(Tables.Content).where({ id: contentId }).first();
      expect(row.publishingStatus).toBe(PublishingStatus.PUBLISHED);
    });

    it('skips content that is not in REVIEW state', async () => {
      const contentId = await insertMovie({ publishingStatus: PublishingStatus.DRAFT });

      await consumer.process(fakeJob(contentId));

      const row = await testDbClient(Tables.Content).where({ id: contentId }).first();
      expect(row.publishingStatus).toBe(PublishingStatus.DRAFT);
    });

    it('skips gracefully when content does not exist', async () => {
      await expect(consumer.process(fakeJob(randomUUID()))).resolves.toBeUndefined();
    });

    it('marks schedulingOutcome as FAILED_VALIDATION when quality gates fail', async () => {
      const contentId = await insertMovie({ publishingStatus: PublishingStatus.REVIEW, withThumbnail: false });

      await consumer.process(fakeJob(contentId));

      const row = await testDbClient(Tables.Content).where({ id: contentId }).first();
      expect(row.schedulingOutcome).toBe('FAILED_VALIDATION');
      expect(row.publishingStatus).toBe(PublishingStatus.REVIEW);
    });
  });
});
