import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CONTENT_TEST_FIXTURES } from '@src/module/content/__test__/e2e/contants';
import { ContentModule } from '@src/module/content/content.module';
import { ContentMedia } from '@src/module/content/persistence/entity/content-media.entity';
import { ContentMediaRepository } from '@src/module/content/persistence/repository/content-media.repository';
import request from 'supertest';

describe('Media Player - Test (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let contentRepository: ContentMediaRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ContentModule],
    }).compile();

    app = module.createNestApplication();
    contentRepository = module.get<ContentMediaRepository>(ContentMediaRepository);
    await app.init();
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
