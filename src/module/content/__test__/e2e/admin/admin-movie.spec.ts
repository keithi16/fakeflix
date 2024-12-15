import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CONTENT_TEST_FIXTURES } from '@src/module/content/__test__/e2e/contants';

import { Tables } from '@testInfra/enum/tables.enum';
import { testDbClient } from '@testInfra/knex.database';
import { createNestApp } from '@testInfra/test-e2e.setup';
import nock, { cleanAll } from 'nock';
import request from 'supertest';

describe('AdminMovieController (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp();
    app = nestTestSetup.app;
    module = nestTestSetup.module;
  });

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2023-01-01'));
  });

  afterEach(async () => {
    await testDbClient(Tables.Video).del();
    await testDbClient(Tables.Movie).del();
    await testDbClient(Tables.Thumbnail).del();
    await testDbClient(Tables.Content).del();
    cleanAll();
  });

  afterAll(async () => {
    //TODO move it to be shared
    await app.close();
    await module.close();
  });

  describe('/admin/video (POST)', () => {
    it('uploads a video', async () => {
      //nock has support to native fetch only in 14.0.0-beta.4
      //https://github.com/nock/nock/issues/2397
      nock('https://api.themoviedb.org/3', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/search/keyword`)
        .query({
          query: 'Test Video',
          page: '1',
        })
        .reply(200, {
          results: [
            {
              id: '1',
            },
          ],
        });

      nock('https://api.themoviedb.org/3', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`discover/movie`)
        .query({
          with_keywords: '1',
        })
        .reply(200, {
          results: [
            {
              vote_average: 8.5,
            },
          ],
        });

      const video = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 1430145,
        duration: 100,
      };

      await request(app.getHttpServer())
        .post('/admin/movie')
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
        .post('/admin/movie')
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
        .post('/admin/movie')
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
