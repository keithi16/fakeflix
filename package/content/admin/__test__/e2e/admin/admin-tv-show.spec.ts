import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CONTENT_TEST_FIXTURES } from '@tlc/content/admin/__test__/e2e/contants';

import { createNestApp } from '@test/infra/test-e2e.setup';
import { cleanUpContentDatabase } from '@tlc/content/__test__/helper/content-db.test-helper';
import { ContentAdminModule } from '@tlc/content/admin/content-admin.module';
import { ContentConfig, contentConfigFactory } from '@tlc/content/config';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import knex, { Knex } from 'knex';
import request from 'supertest';

describe('AdminTvShowController (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let testDbClient: Knex;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      ContentAdminModule,
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
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2023-01-01'));
    await cleanUpContentDatabase(testDbClient);
  });

  afterEach(async () => {
    await cleanUpContentDatabase(testDbClient);
  });

  afterAll(async () => {
    //TODO move it to be shared
    await app.close();
    await module.close();
  });

  describe('/admin/tv-show (POST)', () => {
    it('creates a new tv show', async () => {
      const tvShow = {
        title: 'Test TvShow',
        description: 'This is a test video',
        thumbnailUrl: 'uploads/test.jpg',
      };

      await request(app.getHttpServer())
        .post('/admin/tv-show')
        .attach('thumbnail', `${CONTENT_TEST_FIXTURES}/sample.jpg`)
        .field('title', tvShow.title)
        .field('description', tvShow.description)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toMatchObject({
            id: expect.any(String),
            title: tvShow.title,
            description: tvShow.description,
            thumbnailUrl: expect.stringContaining('jpg'),
          });
        });
    });

    it('adds an episode to a tv show', async () => {
      const tvShow = {
        title: 'Test TvShow',
        description: 'This is a test video',
        thumbnailUrl: 'uploads/test.jpg',
      };

      const { body } = await request(app.getHttpServer())
        .post('/admin/tv-show')
        .attach('thumbnail', `${CONTENT_TEST_FIXTURES}/sample.jpg`)
        .field('title', tvShow.title)
        .field('description', tvShow.description)
        .expect(HttpStatus.CREATED);

      const episode = {
        title: 'Test Episode',
        description: 'This is a test episode',
        videoUrl: 'uploads/test.mp4',
        season: 1,
        number: 1,
        sizeInKb: 1430145,
        duration: null,
      };

      await request(app.getHttpServer())
        .post(`/admin/tv-show/${body.id}/upload-episode`)
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
        .field('title', episode.title)
        .field('description', episode.description)
        .field('season', episode.season)
        .field('number', episode.number)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toMatchObject({
            title: episode.title,
            description: episode.description,
            videoUrl: expect.stringContaining('mp4'),
            sizeInKb: episode.sizeInKb,
            duration: episode.duration,
          });
        });
    });

    it('do not allow creating episode with an existing season and number', async () => {
      const tvShow = {
        title: 'Test TvShow',
        description: 'This is a test video',
        thumbnailUrl: 'uploads/test.jpg',
      };

      const { body } = await request(app.getHttpServer())
        .post('/admin/tv-show')
        .attach('thumbnail', `${CONTENT_TEST_FIXTURES}/sample.jpg`)
        .field('title', tvShow.title)
        .field('description', tvShow.description)
        .expect(HttpStatus.CREATED);

      const episode = {
        title: 'Test Episode',
        description: 'This is a test episode',
        videoUrl: 'uploads/test.mp4',
        season: 1,
        number: 1,
        sizeInKb: 1430145,
        duration: null,
      };

      /**
       * This can also be done with a test factory
       */
      await request(app.getHttpServer())
        .post(`/admin/tv-show/${body.id}/upload-episode`)
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
        .field('title', episode.title)
        .field('description', episode.description)
        .field('season', episode.season)
        .field('number', episode.number)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(`/admin/tv-show/${body.id}/upload-episode`)
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
        .field('title', episode.title)
        .field('description', episode.description)
        .field('season', episode.season)
        .field('number', episode.number)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toBe(
            'Episode with season 1 and number 1 already exists'
          );
        });
    });
  });
});
