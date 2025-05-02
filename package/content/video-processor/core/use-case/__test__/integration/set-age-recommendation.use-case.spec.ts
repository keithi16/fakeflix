import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp } from '@test/infra/test-e2e.setup';
import { contentFactory } from '@tlc/content/__test__/factory/content.factory';
import { movieFactory } from '@tlc/content/__test__/factory/movie.factory';
import { videoMetadataFactory } from '@tlc/content/__test__/factory/video-metadata.factory';
import { videoFactory } from '@tlc/content/__test__/factory/video.factory';
import { cleanUpContentDatabase } from '@tlc/content/__test__/helper/content-db.test-helper';
import { CONTENT_TEST_FIXTURES } from '@tlc/content/admin/__test__/e2e/contants';
import { ContentConfig, contentConfigFactory } from '@tlc/content/config';
import { Video } from '@tlc/content/shared/persistence/entity/video.entity';
import { ContentVideoProcessorModule } from '@tlc/content/video-processor/content-video-processor.module';
import { SetAgeRecommendationUseCase } from '@tlc/content/video-processor/core/use-case/set-age-recommendation.use-case';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import knex, { Knex } from 'knex';
import nock, { cleanAll } from 'nock';

describe('SetAgeRecommendationUseCase', () => {
  let module: TestingModule;
  let app: INestApplication;
  let testDbClient: Knex;
  let setAgeRecommendationUseCase: SetAgeRecommendationUseCase;

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
    setAgeRecommendationUseCase = module.get<SetAgeRecommendationUseCase>(
      SetAgeRecommendationUseCase
    );

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

  it('analyzes the age recomendation for the video and updates the content', async () => {
    const content = contentFactory.build({
      ageRecommendation: 10,
    });
    const movie = movieFactory.build({
      contentId: content.id,
    });
    const video = videoFactory.build({
      url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
      movieId: movie.id,
    });
    const videoMetadata = videoMetadataFactory.build({
      videoId: video.id,
    });
    await testDbClient('Content').insert(content);
    await testDbClient('Movie').insert(movie);
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

    const videoEntity = new Video(video);

    await setAgeRecommendationUseCase.setAgeRecommendation(videoEntity);
    const updatedVideoMetadata = await testDbClient('VideoMetadata')
      .where({ videoId: video.id })
      .first();

    expect(updatedVideoMetadata).toBeDefined();
    expect(updatedVideoMetadata.ageRatingCategories).toEqual([
      'language',
      'thematic elements',
    ]);
    expect(updatedVideoMetadata.ageRating).toEqual(12);
    expect(updatedVideoMetadata.ageRatingExplanation).toEqual(
      'The video contains mild language and thematic elements appropriate for viewers 12 and above.'
    );
  });
});
