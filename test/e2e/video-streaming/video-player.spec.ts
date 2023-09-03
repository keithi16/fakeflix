import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { StreamingModule } from '@src/module/content/streaming.module';
import fs from 'fs-extra';
import request from 'supertest';

describe('Media Player - Test (e2e)', () => {
  let app: INestApplication;
  let sampleVideo: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [StreamingModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    const video = VideoEntity.create({
      title: 'Test Video',
      description: 'This is a test video',
      videoUrl: 'uploads/test.mp4',
      thumbnailUrl: 'uploads/test.jpg',
      sizeInKb: 1430145,
      duration: 100,
    });

    const { body: createdVideo } = await request(app.getHttpServer())
      .post('/admin/video')
      .attach('files', './test/e2e/fixtures/sample.mp4')
      .attach('files', './test/e2e/fixtures/sample.jpg')
      .field('title', video.title)
      .field('description', video.description)
      .expect(HttpStatus.CREATED);

    sampleVideo = createdVideo;
  });
  afterEach(async () => {
    await fs.remove(`.${sampleVideo.videoUrl}`);
  });

  describe('/player/stream/:videoId', () => {
    it('streams a video', async () => {
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
