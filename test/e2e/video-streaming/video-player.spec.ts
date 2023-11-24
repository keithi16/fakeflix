import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentModule } from '@src/module/content/content.module';
import { ContentRepository } from '@src/module/content/shared/persistence/repository/content.repository';
import fs from 'fs-extra';
import request from 'supertest';

describe('Media Player - Test (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let contentRepository: ContentRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ContentModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    contentRepository = module.get<ContentRepository>(ContentRepository);
  });

  beforeEach(async () => {
    await contentRepository.clear();
  });
  afterAll(() => module.close());

  describe('/player/stream/:videoId', () => {
    it('streams a video', async () => {
      const { body: sampleVideo } = await request(app.getHttpServer())
        .post('/admin/video')
        .attach('video', './test/e2e/fixtures/sample.mp4')
        .attach('thumbnail', './test/e2e/fixtures/sample.jpg')
        .field('title', 'Test Video')
        .field('description', 'This is a test video')
        .expect(HttpStatus.CREATED);

      const fileSize = 1430145;
      const range = `bytes=0-${fileSize - 1}`;

      const response = await request(app.getHttpServer())
        .get(`/player/stream/${sampleVideo.id}`)
        .set('Range', range)
        .expect(HttpStatus.PARTIAL_CONTENT);

      expect(response.headers['content-range']).toBe(
        `bytes 0-${fileSize - 1}/${fileSize}`
      );
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.headers['content-length']).toBe(String(fileSize));
      expect(response.headers['content-type']).toBe('video/mp4');

      await fs.remove(`.${sampleVideo.videoUrl}`);
    });
    it('returns 500 if range is invalid', async () => {
      const range = 'bytes=invalid-range';

      await request(app.getHttpServer())
        .get('/player/stream/45705b56-a47f-4869-b736-8f6626c940f8')
        .set('Range', range)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
