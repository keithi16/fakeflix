import { TestingModule } from '@nestjs/testing';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import { cleanAll } from 'nock';
import { ContentConfig, contentConfigFactory } from '../../../../../config';
import { movieFactory } from '../../../../../__test__/factory/movie.factory';
import { ContentCatalogModule } from '../../../../content-catalog.module';
import { ContentCatalogFacade } from '../../../facade/content-catalog.facade';
import { ContentCatalogApi } from '@tlc/shared-module/public-api';

describe('ContentCatalogFacade - findAllWithGenres (e2e)', () => {
  let module: TestingModule;
  let testDbClient: Knex;
  let facade: ContentCatalogFacade;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [contentConfigFactory],
      }),
      ContentCatalogModule,
    ]);
    module = nestTestSetup.module;
    const configService = module.get<ConfigService<ContentConfig>>(ConfigService);
    testDbClient = knex({
      client: 'pg',
      connection: `${configService.get('content.database.url')}`,
      searchPath: ['public'],
    });
    facade = module.get<ContentCatalogFacade>(ContentCatalogApi);
  });

  afterEach(async () => {
    await testDbClient(Tables.Content).del();
    cleanAll();
  });

  afterAll(async () => {
    module.close();
  });

  describe('findAllWithGenres()', () => {
    it('returns content items with the correct shape', async () => {
      const movie = movieFactory.build({
        genres: ['Action', 'Drama'],
        releaseDate: new Date('2023-06-15'),
      });
      await testDbClient(Tables.Content).insert({ ...movie, genres: JSON.stringify(movie.genres) });

      const result = await facade.findAllWithGenres();

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: movie.id,
            title: movie.title,
            type: movie.type,
            genres: movie.genres,
            releaseDate: expect.any(Date),
          }),
        ]),
      );
    });

    it('returns empty array when no content exists', async () => {
      const result = await facade.findAllWithGenres();
      expect(result).toEqual([]);
    });
  });
});
