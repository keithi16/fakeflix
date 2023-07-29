import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@src/app.module';
import { VideoEntity } from '@src/module/streaming/core/entity/video.entity';
import { VideoManagerService } from '@src/module/streaming/core/service/video-manager.service';
import { VideoRepository } from '@src/module/streaming/storage/repository/video.repository';
import request from 'supertest';

describe('VideoController (e2e)', () => {
  let app: INestApplication;
  let videoManagerService: VideoManagerService;
  let videoRepository: VideoRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    videoManagerService = moduleFixture.get<VideoManagerService>(VideoManagerService);
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
    it('should upload a video', async () => {
      const video = VideoEntity.create({
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        size: 100,
        duration: 100,
      });

      const response = await request(app.getHttpServer())
        .post('/admin/video')
        .attach('file', './test/e2e/fixtures/sample.mp4')
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.CREATED);

      const savedVideo = await videoManagerService.getVideoById(response.body.id);

      expect(savedVideo).toMatchObject({
        title: video.title,
        description: video.description,
        videoUrl: savedVideo?.videoUrl,
        thumbnailUrl: savedVideo?.thumbnailUrl,
        size: savedVideo?.size,
        duration: savedVideo?.duration,
      });
    });

    it('should not allow non mp4 files', async () => {
      const video = VideoEntity.create({
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        size: 100,
        duration: 100,
      });

      await request(app.getHttpServer())
        .post('/admin/video')
        .attach('file', './test/e2e/fixtures/sample.mp3')
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: 'Validation failed (expected type is video/mp4)',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });
});
