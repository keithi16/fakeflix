import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import { movieFactory } from '../../../../__test__/factory/movie.factory';
import { videoFactory } from '../../../../__test__/factory/video.factory';
import { cleanUpContentDatabase } from '../../../../__test__/helper/content-db.test-helper';
import { ContentConfig, contentConfigFactory } from '../../../../config';
import { ContentManagementModule } from '../../../content-management.module';
import { ContentAgeRecommendationConsumer } from '../../../queue/consumer/content-age-recommendation.queue-consumer';

describe('ContentAgeRecommendationConsumer (integration)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let testDbClient: Knex;
  let consumer: ContentAgeRecommendationConsumer;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      ContentManagementModule,
    ]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
    const configService = module.get<ConfigService<ContentConfig>>(ConfigService);
    testDbClient = knex({
      client: 'pg',
      connection: `${configService.get('content.database.url')}`,
      searchPath: ['public'],
    });
    consumer = module.get(ContentAgeRecommendationConsumer);
  });

  beforeEach(async () => {
    await cleanUpContentDatabase(testDbClient);
  });

  afterEach(async () => {
    await cleanUpContentDatabase(testDbClient);
  });

  afterAll(async () => {
    await app.close();
    await module.close();
  }, 30000);

  it('updates the age recommendation for a movie content item', async () => {
    const video = videoFactory.build();
    await testDbClient('ContentVideo').insert(video);

    const movie = movieFactory.build({ videoId: video.id, ageRecommendation: null });
    await testDbClient('ContentItem').insert({
      id: movie.id,
      type: movie.type,
      title: movie.title,
      description: movie.description,
      ageRecommendation: null,
      videoId: video.id,
      externalRating: movie.externalRating,
      releaseDate: movie.releaseDate,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
      deletedAt: null,
    });

    const job = { data: { videoId: video.id, ageRecommendation: 16 } } as any;
    await consumer.process(job);

    const [updated] = await testDbClient('ContentItem').where({ id: movie.id }).select('ageRecommendation');
    expect(updated.ageRecommendation).toBe(16);
  });

  it('skips processing when ageRecommendation is null', async () => {
    const video = videoFactory.build();
    await testDbClient('ContentVideo').insert(video);

    const movie = movieFactory.build({ videoId: video.id, ageRecommendation: 12 });
    await testDbClient('ContentItem').insert({
      id: movie.id,
      type: movie.type,
      title: movie.title,
      description: movie.description,
      ageRecommendation: 12,
      videoId: video.id,
      externalRating: movie.externalRating,
      releaseDate: movie.releaseDate,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
      deletedAt: null,
    });

    const job = { data: { videoId: video.id, ageRecommendation: null } } as any;
    await consumer.process(job);

    const [unchanged] = await testDbClient('ContentItem').where({ id: movie.id }).select('ageRecommendation');
    expect(unchanged.ageRecommendation).toBe(12);
  });
});
