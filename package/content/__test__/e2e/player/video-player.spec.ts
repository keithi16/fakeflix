import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { Tables } from '@test/infra/enum/tables.enum';
import { createNestApp } from '@test/infra/test-e2e.setup';
import { CONTENT_TEST_FIXTURES } from '@tlc/content/__test__/e2e/contants';
import { videoFactory } from '@tlc/content/__test__/factory/video.factory';
import { ContentConfig, contentConfigFactory } from '@tlc/content/config';
import { ContentModule } from '@tlc/content/content.module';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import knex, { Knex } from 'knex';
import request from 'supertest';

describe('Media Player - Test (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      ContentModule,
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
    await testDbClient(Tables.Video).del();
  });
  afterAll(async () => await module.close());

  describe('/player/stream/:videoId', () => {
    it('streams a video', async () => {
      const fakeVideo = videoFactory.build({
        url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
      });
      await testDbClient(Tables.Video).insert(fakeVideo);

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
  });
});
