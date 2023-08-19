import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@src/app.module';
import { VideoEntity } from '@src/module/streaming/shared/core/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/shared/storage/repository/video.repository';
import request from 'supertest';

describe('VideoController (e2e)', () => {
  let app: INestApplication;
  let videoRepository: VideoRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    videoRepository = moduleFixture.get<VideoRepository>(VideoRepository);
  });

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2023-01-01'));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await videoRepository.clear();
  });

  describe('/admin/video (POST)', () => {
    it('uploads a video', async () => {
      const video = VideoEntity.create({
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 1430145,
        duration: 100,
      });

      await request(app.getHttpServer())
        .post('/admin/video')
        .attach('files', './test/e2e/fixtures/sample.mp4')
        .attach('files', './test/e2e/fixtures/sample.jpg')
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toMatchObject({
            title: video.title,
            description: video.description,
            videoUrl: expect.stringContaining('mp4'),
            thumbnailUrl: expect.stringContaining('jpg'),
            sizeInKb: video.sizeInKb,
            duration: video.duration,
          });
        });
    });

    it('throws an error when the thumbnail is not provided', async () => {
      const video = VideoEntity.create({
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 1430145,
        duration: 100,
      });

      await request(app.getHttpServer())
        .post('/admin/video')
        .attach('files', './test/e2e/fixtures/sample.mp4')
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toMatchObject({
            message: 'Both video and thumbnail files are required.',
            error: 'Bad Request',
            statusCode: 400,
          });
        });
    });

    it('does not allow non mp4 files', async () => {
      const video = VideoEntity.create({
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 100,
        duration: 100,
      });

      await request(app.getHttpServer())
        .post('/admin/video')
        .attach('files', './test/e2e/fixtures/sample.mp3')
        .attach('files', './test/e2e/fixtures/sample.jpg')
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: 'Both video and thumbnail files are required.',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });
});
