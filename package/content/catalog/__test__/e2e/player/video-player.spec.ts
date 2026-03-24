import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { videoFactory } from '../../../../__test__/factory/video.factory';
import { cleanUpContentDatabase } from '../../../../__test__/helper/content-db.test-helper';
import { CONTENT_TEST_FIXTURES } from '../../../../management/__test__/e2e/contants';
import { ContentConfig, contentConfigFactory } from '../../../../config';
import { ContentCatalogModule } from '../../../content-catalog.module';

describe('Media Player - Test (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      ContentCatalogModule,
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
    await cleanUpContentDatabase(testDbClient);
  });
  afterAll(async () => await module.close());

  describe('/player/stream/:videoId', () => {
    it('streams a video', async () => {
      const fakeVideo = videoFactory.build({
        url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
      });
      await testDbClient('ContentVideo').insert(fakeVideo);

      const fileSize = 1430145;
      const range = `bytes=0-${fileSize - 1}`;

      const response = await request(app.getHttpServer())
        .get(`/player/stream/${fakeVideo.id}`)
        .set('Range', range)
        .expect(HttpStatus.PARTIAL_CONTENT);

      expect(response.headers['content-range']).toBe(
        `bytes 0-${fileSize - 1}/${fileSize}`
      );
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.headers['content-length']).toBe(String(fileSize));
      expect(response.headers['content-type']).toBe('video/mp4');
    });

    it('returns 404 when video does not exist', async () => {
      await request(app.getHttpServer())
        .get(`/player/stream/${randomUUID()}`)
        .set('Range', 'bytes=0-1023')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
