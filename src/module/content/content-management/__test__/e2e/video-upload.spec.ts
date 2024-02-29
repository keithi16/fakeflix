import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CONTENT_TEST_FIXTURES } from '@src/module/content/__test__/contants';

import { ContentRepository } from '@src/module/content/content-management/persistence/repository/content.repository';
import { MovieRepository } from '@src/module/content/content-management/persistence/repository/movie.repository';
import { VideoRepository } from '@src/module/content/content-management/persistence/repository/video.repository';
import { createNestApp } from '@testInfra/test-e2e.setup';
import request from 'supertest';

describe('VideoController (e2e)', () => {
  let contentRepository: ContentRepository;
  let movieRepository: MovieRepository;
  let videoRepository: VideoRepository;
  let module: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp();
    app = nestTestSetup.app;
    module = nestTestSetup.module;

    contentRepository = module.get<ContentRepository>(ContentRepository);
    movieRepository = module.get<MovieRepository>(MovieRepository);
    videoRepository = module.get<VideoRepository>(VideoRepository);
  });

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2023-01-01'));
  });

  afterEach(async () => {
    await videoRepository.deleteAll();
    await movieRepository.deleteAll();
    await contentRepository.deleteAll();
  });

  afterAll(async () => {
    //TODO move it to be shared
    await app.close();
    module.close();
  });

  describe('/admin/video (POST)', () => {
    it('uploads a video', async () => {
      const video = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 1430145,
        duration: 100,
      };

      await request(app.getHttpServer())
        .post('/admin/video')
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
        .attach('thumbnail', `${CONTENT_TEST_FIXTURES}/sample.jpg`)
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
      const video = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 1430145,
        duration: 100,
      };

      await request(app.getHttpServer())
        .post('/admin/video')
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
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
      const video = {
        title: 'Test Video',
        description: 'This is a test video',
      };

      await request(app.getHttpServer())
        .post('/admin/video')
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp3`)
        .attach('thumbnail', `${CONTENT_TEST_FIXTURES}/sample.jpg`)
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: 'Invalid file type. Only video/mp4 and image/jpeg are supported.',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });
});
