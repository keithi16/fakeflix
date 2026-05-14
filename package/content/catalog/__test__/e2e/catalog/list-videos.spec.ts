import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { createNestApp } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import { cleanAll } from 'nock';
import request from 'supertest';
import { ContentConfig, contentConfigFactory } from '../../../../config';
import { videoFactory } from '../../../../__test__/factory/video.factory';
import { ContentCatalogModule } from '../../../content-catalog.module';

describe('ContentCatalog - listVideos GraphQL (e2e)', () => {
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

  afterEach(async () => {
    await testDbClient('ContentVideo').del();
    cleanAll();
  });

  afterAll(async () => {
    await app.close();
    module.close();
  });

  describe('listVideos query', () => {
    it('returns seeded videos', async () => {
      const video = videoFactory.build();
      await testDbClient('ContentVideo').insert(video);

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ listVideos { id url sizeInKb duration } }' });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listVideos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: video.id,
            url: video.url,
          }),
        ]),
      );
    });

    it('returns empty array when no videos exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ listVideos { id url sizeInKb duration } }' });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listVideos).toEqual([]);
    });
  });
});
