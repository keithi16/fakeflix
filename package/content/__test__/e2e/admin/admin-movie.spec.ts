import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

import { createNestApp } from '@test/infra/test-e2e.setup';
import { CONTENT_TEST_FIXTURES } from '@tlc/content/__test__/e2e/contants';
import { ContentConfig, contentConfigFactory } from '@tlc/content/config';
import { ContentModule } from '@tlc/content/content.module';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { knex, type Knex } from 'knex';
import nock, { cleanAll } from 'nock';
import request from 'supertest';

describe('AdminMovieController (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;
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
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2023-01-01'));
    await testDbClient('Video').del();
    await testDbClient('VideoMetadata').del();
    await testDbClient('Episode').del();
    await testDbClient('Movie').del();
    await testDbClient('TvShow').del();

    await testDbClient('Content').del();
    await testDbClient('Thumbnail').del();
  });

  afterEach(async () => {
    // First, clean up tables with foreign keys referring to other tables
    await testDbClient('Video').del();
    await testDbClient('VideoMetadata').del();
    await testDbClient('Episode').del();
    await testDbClient('Movie').del();
    await testDbClient('TvShow').del();

    // Then clean up content and other supporting tables
    await testDbClient('Content').del();
    await testDbClient('Thumbnail').del();

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

      nock('https://generativelanguage.googleapis.com')
        .post('/v1beta/models/gemini-2.0-flash:generateContent')
        .query(true) // Match any query parameters
        .reply(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      responseText: 'This is a test video summary.',
                    }),
                  },
                ],
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        });

      nock('https://generativelanguage.googleapis.com')
        .post('/v1beta/models/gemini-2.0-flash:generateContent')
        .query(true) // Match any query parameters
        .reply(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      responseText: 'This is a test video transcript.',
                    }),
                  },
                ],
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        });

      nock('https://generativelanguage.googleapis.com')
        .post('/v1beta/models/gemini-2.0-flash:generateContent')
        .query(true) // Match any query parameters
        .reply(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      ageRating: 12,
                      explanation:
                        'The video contains mild language and thematic elements appropriate for viewers 12 and above.',
                      categories: ['language', 'thematic elements'],
                    }),
                  },
                ],
              },
              finishReason: 'STOP',
              index: 0,
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
        .expect(async (response) => {
          const metadata = await testDbClient('VideoMetadata').first();
          expect(metadata).toMatchObject({
            autoGeneratedDescription: 'This is a test video summary.',
            transcript: 'This is a test video transcript.',
            ageRating: 12,
            ageRatingExplanation:
              'The video contains mild language and thematic elements appropriate for viewers 12 and above.',
            ageRatingCategories: ['language', 'thematic elements'],
          });
          expect(response.body).toMatchObject({
            title: video.title,
            description: video.description,
            videoUrl: expect.stringContaining('mp4'),
            thumbnailUrl: expect.stringContaining('jpg'),
            sizeInKb: video.sizeInKb,
            duration: video.duration,
          });
        });
    }, 300000);

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
