import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import nock, { cleanAll } from 'nock';
import { movieFactory } from '../../../../../__test__/factory/movie.factory';
import { videoMetadataFactory } from '../../../../../__test__/factory/video-metadata.factory';
import { videoFactory } from '../../../../../__test__/factory/video.factory';
import { cleanUpContentDatabase } from '../../../../../__test__/helper/content-db.test-helper';
import { CONTENT_TEST_FIXTURES } from '../../../../../admin/__test__/e2e/contants';
import { ContentConfig, contentConfigFactory } from '../../../../../config';
import { Video } from '../../../../../shared/persistence/entity/video.entity';
import { ContentVideoProcessorModule } from '../../../../content-video-processor.module';
import { TranscribeVideoUseCase } from '../../transcribe-video.use-case';

describe('TranscribeVideoUseCase', () => {
  let module: TestingModule;
  let app: INestApplication;
  let testDbClient: Knex;
  let transcribeVideoUseCase: TranscribeVideoUseCase;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      ContentVideoProcessorModule,
    ]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
    const configService = module.get<ConfigService<ContentConfig>>(ConfigService);
    transcribeVideoUseCase = module.get<TranscribeVideoUseCase>(TranscribeVideoUseCase);

    testDbClient = knex({
      client: 'pg',
      connection: `${configService.get('content.database.url')}`,
      searchPath: ['public'],
    });
  });

  afterEach(async () => {
    await cleanUpContentDatabase(testDbClient);

    cleanAll();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    //TODO move it to be shared
    await app.close();
    await module.close();
  });

  it('generates a transcript for a video with existing metadata', async () => {
    const movieContent = movieFactory.build();
    const video = videoFactory.build({
      url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
    });
    const videoMetadata = videoMetadataFactory.build({
      videoId: video.id,
    });
    await testDbClient('Content').insert(movieContent);
    await testDbClient('Video').insert(video);
    await testDbClient('VideoMetadata').insert(videoMetadata);

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

    const videoEntity = new Video(video);

    await transcribeVideoUseCase.generateTranscript(videoEntity);
    const updatedVideoMetadata = await testDbClient('VideoMetadata')
      .where({ videoId: video.id })
      .first();
    expect(updatedVideoMetadata).toBeDefined();
    expect(updatedVideoMetadata.transcript).toEqual('This is a test video transcript.');
  });

  it('creates new metadata when no metadata exists for the video', async () => {
    // Create content without metadata
    const movieContent = movieFactory.build();
    const video = videoFactory.build({
      url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
    });
    await testDbClient('Content').insert(movieContent);
    await testDbClient('Video').insert(video);

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
                    responseText: 'This is a new test video transcript.',
                  }),
                },
              ],
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
      });

    const videoEntity = new Video(video);

    await transcribeVideoUseCase.generateTranscript(videoEntity);

    const newMetadata = await testDbClient('VideoMetadata')
      .where({ videoId: video.id })
      .first();

    expect(newMetadata).toBeDefined();
    expect(newMetadata.transcript).toEqual('This is a new test video transcript.');
  });

  it('handles API errors during transcript generation', async () => {
    const movieContent = movieFactory.build();
    const video = videoFactory.build({
      url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
    });
    await testDbClient('Content').insert(movieContent);
    await testDbClient('Video').insert(video);

    // Mock the API to throw an error
    nock('https://generativelanguage.googleapis.com')
      .post('/v1beta/models/gemini-2.0-flash:generateContent')
      .query(true)
      .replyWithError('API connection error');

    const videoEntity = new Video(video);

    await expect(
      transcribeVideoUseCase.generateTranscript(videoEntity)
    ).rejects.toThrow();
  });
});
