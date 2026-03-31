import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import { cleanAll } from 'nock';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { ContentConfig, contentConfigFactory } from '../../../../config';
import { movieFactory } from '../../../../__test__/factory/movie.factory';
import { PublishingStatus } from '../../../../shared/core/enum/publishing-status.enum';
import { ContentCatalogModule } from '../../../content-catalog.module';

const GRAPHQL_LIST_CONTENT = '{ listContent { id title type } }';

describe('ContentCatalog - publishing status filtering (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      GraphQLModule.forRoot<ApolloDriverConfig>({
        autoSchemaFile: true,
        driver: ApolloDriver,
      }),
      ContentCatalogModule,
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
    await testDbClient(Tables.Content).del();
  });

  afterEach(async () => {
    await testDbClient(Tables.Content).del();
    cleanAll();
  });

  afterAll(async () => {
    await app.close();
    await module.close();
  });

  describe('listContent publishing status filter', () => {
    it('does NOT return DRAFT content', async () => {
      const draftMovie = movieFactory.build({ publishingStatus: PublishingStatus.DRAFT });
      await testDbClient(Tables.Content).insert(draftMovie);

      const res = await request(app.getHttpServer()).post('/graphql').send({ query: GRAPHQL_LIST_CONTENT });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listContent).toEqual([]);
    });

    it('does NOT return REVIEW content', async () => {
      const reviewMovie = movieFactory.build({ publishingStatus: PublishingStatus.REVIEW });
      await testDbClient(Tables.Content).insert(reviewMovie);

      const res = await request(app.getHttpServer()).post('/graphql').send({ query: GRAPHQL_LIST_CONTENT });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listContent).toEqual([]);
    });

    it('returns PUBLISHED content', async () => {
      const publishedMovie = movieFactory.build({ publishingStatus: PublishingStatus.PUBLISHED });
      await testDbClient(Tables.Content).insert(publishedMovie);

      const res = await request(app.getHttpServer()).post('/graphql').send({ query: GRAPHQL_LIST_CONTENT });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listContent).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: publishedMovie.id,
            title: publishedMovie.title,
            type: publishedMovie.type,
          }),
        ]),
      );
    });

    it('does NOT return ARCHIVED content', async () => {
      const archivedMovie = movieFactory.build({ publishingStatus: PublishingStatus.ARCHIVED });
      await testDbClient(Tables.Content).insert(archivedMovie);

      const res = await request(app.getHttpServer()).post('/graphql').send({ query: GRAPHQL_LIST_CONTENT });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listContent).toEqual([]);
    });

    it('returns only PUBLISHED content when mixed statuses are present', async () => {
      const draftMovie = movieFactory.build({ id: randomUUID(), publishingStatus: PublishingStatus.DRAFT });
      const reviewMovie = movieFactory.build({ id: randomUUID(), publishingStatus: PublishingStatus.REVIEW });
      const publishedMovie = movieFactory.build({ id: randomUUID(), publishingStatus: PublishingStatus.PUBLISHED });
      const archivedMovie = movieFactory.build({ id: randomUUID(), publishingStatus: PublishingStatus.ARCHIVED });

      await testDbClient(Tables.Content).insert([draftMovie, reviewMovie, publishedMovie, archivedMovie]);

      const res = await request(app.getHttpServer()).post('/graphql').send({ query: GRAPHQL_LIST_CONTENT });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listContent).toHaveLength(1);
      expect(res.body.data.listContent).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: publishedMovie.id,
            title: publishedMovie.title,
            type: publishedMovie.type,
          }),
        ]),
      );
    });
  });
});
