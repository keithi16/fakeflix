import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import { cleanAll } from 'nock';
import request from 'supertest';
import { ContentConfig, contentConfigFactory } from '../../../../config';
import { movieFactory } from '../../../../__test__/factory/movie.factory';
import { ContentCatalogModule } from '../../../content-catalog.module';

describe('ContentCatalog - listContent GraphQL (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
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
    await testDbClient(Tables.Content).del();
    cleanAll();
  });

  afterAll(async () => {
    await app.close();
    module.close();
  });

  describe('listContent query', () => {
    it('returns seeded content items', async () => {
      const movie = movieFactory.build({ genres: ['Action', 'Drama'] });
      await testDbClient(Tables.Content).insert(movie);

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ listContent { id title type } }' });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listContent).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: movie.id,
            title: movie.title,
            type: movie.type,
          }),
        ]),
      );
    });

    it('returns empty array when no content exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ listContent { id title type } }' });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.listContent).toEqual([]);
    });
  });
});
