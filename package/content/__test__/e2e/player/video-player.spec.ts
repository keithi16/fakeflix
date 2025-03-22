import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp } from '@test/infra/test-e2e.setup';
import { CONTENT_TEST_FIXTURES } from '@tlc/content/__test__/e2e/contants';
import { contentConfigFactory } from '@tlc/content/config';
import { ContentModule } from '@tlc/content/content.module';
import { ContentMedia } from '@tlc/content/persistence/entity/content-media.entity';
import { ContentMediaRepository } from '@tlc/content/persistence/repository/content-media.repository';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import request from 'supertest';

describe('Media Player - Test (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let contentRepository: ContentMediaRepository;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      ContentModule,
    ]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
    contentRepository = module.get<ContentMediaRepository>(ContentMediaRepository);
  });

  beforeEach(async () => {
    await contentRepository.deleteAll();
  });
  afterAll(async () => await module.close());

  describe('/player/stream/:videoId', () => {
    it('streams a video', async () => {
      const contentMedia = new ContentMedia({
        contentId: faker.string.uuid(),
        title: 'Test Video',
        description: 'This is a test video',
        type: 'video',
        createdAt: new Date(),
        updatedAt: new Date(),
        movieId: faker.string.uuid(),
        metadata: {
          url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
          duration: 100,
          sizeInKb: 1150,
          videoId: faker.string.uuid(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await contentRepository.save(contentMedia);

      const fileSize = 1430145;
      const range = `bytes=0-${fileSize - 1}`;

      const response = await request(app.getHttpServer())
        .get(`/player/stream/${contentMedia.metadata.videoId}`)
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
