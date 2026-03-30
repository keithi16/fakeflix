import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tables } from '@tlc/shared-lib/test';
import { AuthModule } from '@tlc/shared-module/auth';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AnalyticsApi, ContentCatalogApi } from '@tlc/shared-module/public-api';
import knex, { Knex } from 'knex';
import request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { recommendationsConfigFactory } from '../../../recommendations.module';
import { Config } from '../../../config';
import { ContinueWatchingService } from '../../../core/service/continue-watching.service';
import { PersonalizedRecommendationService } from '../../../core/service/personalized-recommendation.service';
import { RecommendationComputationService } from '../../../core/service/recommendation-computation.service';
import { RecommendationsController } from '../../../http/rest/controller/recommendations.controller';
import { OptionalAuthGuard } from '../../../http/rest/guard/optional-auth.guard';
import { RecommendationsPersistenceModule } from '../../../persistence/recommendations-persistence.module';
import { continueWatchingDismissFactory } from '../../factory/continue-watching-dismiss.factory';
import { preComputedRecommendationFactory } from '../../factory/pre-computed-recommendation.factory';

const fakeUserId = faker.string.uuid();

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(
    (
      _token: string,
      _secret: string,
      _options: unknown,
      callback: (err: Error | null, decoded: unknown) => void,
    ) => {
      callback(null, { sub: fakeUserId });
    },
  ),
}));

describe('RecommendationsController (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;

  const mockAnalyticsApi = {
    getUserGenreAffinities: jest.fn(),
    getUserWatchHistory: jest.fn(),
    getUserResumePosition: jest.fn(),
    getTrendingContent: jest.fn(),
    getContentPerformanceMetrics: jest.fn(),
  };

  const mockContentCatalogApi = {
    findAllWithGenres: jest.fn(),
  };

  beforeAll(async () => {
    initializeTransactionalContext();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [recommendationsConfigFactory] }),
        AuthModule,
        LoggerModule,
        RecommendationsPersistenceModule,
      ],
      providers: [
        { provide: AnalyticsApi, useValue: mockAnalyticsApi },
        { provide: ContentCatalogApi, useValue: mockContentCatalogApi },
        RecommendationComputationService,
        ContinueWatchingService,
        PersonalizedRecommendationService,
        OptionalAuthGuard,
      ],
      controllers: [RecommendationsController],
    }).compile();

    module = moduleRef;
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    const configService = moduleRef.get<ConfigService<Config>>(ConfigService);
    testDbClient = knex({
      client: 'pg',
      connection: configService.get('recommendations.database.url'),
      searchPath: ['public'],
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAnalyticsApi.getTrendingContent.mockResolvedValue([
      {
        contentId: faker.string.uuid(),
        contentType: 'MOVIE',
        rank: 1,
        trendingScore: 100,
        viewCount: 1000,
        uniqueViewers: 800,
      },
    ]);
    await testDbClient(Tables.RecommendationsPreComputed).del();
    await testDbClient(Tables.RecommendationsContinueWatchingDismiss).del();
  });

  afterAll(async () => {
    await app.close();
    await module.close();
    await testDbClient.destroy();
  });

  // ============================
  // GET /recommendations
  // ============================

  describe('GET /recommendations', () => {
    it('returns trending content for anonymous user (REC-06)', async () => {
      const trending = [
        {
          contentId: faker.string.uuid(),
          contentType: 'MOVIE',
          rank: 1,
          trendingScore: 100,
          viewCount: 1000,
          uniqueViewers: 800,
        },
      ];
      mockAnalyticsApi.getTrendingContent.mockResolvedValue(trending);

      const res = await request(app.getHttpServer()).get('/recommendations');

      expect(res.status).toBe(HttpStatus.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns pre-computed results for logged-in user on cache hit (REC-01, REC-02)', async () => {
      const recs = Array.from({ length: 3 }, (_, i) =>
        preComputedRecommendationFactory.build({ userId: fakeUserId, rank: i + 1 }),
      );
      await testDbClient(Tables.RecommendationsPreComputed).insert(recs);

      const res = await request(app.getHttpServer())
        .get('/recommendations')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.length).toBe(3);
      expect(res.body[0]).toHaveProperty('rank');
    });

    it('falls back to trending for new user with no affinities (REC-03)', async () => {
      mockAnalyticsApi.getUserGenreAffinities.mockResolvedValue([]);
      mockAnalyticsApi.getUserWatchHistory.mockResolvedValue([]);
      mockContentCatalogApi.findAllWithGenres.mockResolvedValue([]);
      const trending = [
        {
          contentId: faker.string.uuid(),
          contentType: 'MOVIE',
          rank: 1,
          trendingScore: 100,
          viewCount: 1000,
          uniqueViewers: 800,
        },
      ];
      mockAnalyticsApi.getTrendingContent.mockResolvedValue(trending);

      const res = await request(app.getHttpServer())
        .get('/recommendations')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('excludes completed content from personalized recommendations (REC-04)', async () => {
      const completedContentId = faker.string.uuid();
      const otherContentId = faker.string.uuid();

      mockAnalyticsApi.getUserGenreAffinities.mockResolvedValue([
        { genre: 'Action', affinityScore: 5, totalWatchTimeMs: 1000, contentCount: 2 },
      ]);
      mockAnalyticsApi.getUserWatchHistory.mockResolvedValue([
        {
          contentId: completedContentId,
          contentType: 'MOVIE',
          completionPercentage: 95,
          completed: true,
          lastWatchedAt: new Date(),
          lastWatchedPositionMs: 0,
          totalWatchTimeMs: 0,
          watchCount: 1,
          firstWatchedAt: new Date(),
        },
      ]);
      mockContentCatalogApi.findAllWithGenres.mockResolvedValue([
        { id: completedContentId, title: 'Completed Movie', type: 'MOVIE', genres: ['Action'], releaseDate: null },
        { id: otherContentId, title: 'Other Movie', type: 'MOVIE', genres: ['Action'], releaseDate: null },
      ]);

      const res = await request(app.getHttpServer())
        .get('/recommendations')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      const contentIds = res.body.map((item: { contentId: string }) => item.contentId);
      expect(contentIds).not.toContain(completedContentId);
      expect(contentIds).toContain(otherContentId);
    });

    it('returns partial results when catalog has fewer than 20 matches (REC-07)', async () => {
      const contentIds = Array.from({ length: 3 }, () => faker.string.uuid());

      mockAnalyticsApi.getUserGenreAffinities.mockResolvedValue([
        { genre: 'Action', affinityScore: 5, totalWatchTimeMs: 1000, contentCount: 2 },
      ]);
      mockAnalyticsApi.getUserWatchHistory.mockResolvedValue([]);
      mockContentCatalogApi.findAllWithGenres.mockResolvedValue(
        contentIds.map((id) => ({ id, title: 'Movie', type: 'MOVIE', genres: ['Action'], releaseDate: null })),
      );

      const res = await request(app.getHttpServer())
        .get('/recommendations')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.length).toBe(3);
    });
  });

  // ============================
  // GET /recommendations/continue-watching
  // ============================

  describe('GET /recommendations/continue-watching', () => {
    it('returns partially-watched items with resume position (CW-01, CW-03)', async () => {
      const contentId = faker.string.uuid();

      mockAnalyticsApi.getUserWatchHistory.mockResolvedValue([
        {
          contentId,
          contentType: 'MOVIE',
          completionPercentage: 45,
          completed: false,
          lastWatchedAt: new Date(),
          lastWatchedPositionMs: 45000,
          totalWatchTimeMs: 100000,
          watchCount: 1,
          firstWatchedAt: new Date(),
        },
      ]);
      mockAnalyticsApi.getUserResumePosition.mockResolvedValue({ positionMs: 45000, completionPercentage: 45 });

      const res = await request(app.getHttpServer())
        .get('/recommendations/continue-watching')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.length).toBe(1);
      expect(res.body[0].contentId).toBe(contentId);
      expect(res.body[0].resumePositionMs).toBe(45000);
    });

    it('excludes completed content from continue watching (CW-02)', async () => {
      const completedId = faker.string.uuid();
      const partialId = faker.string.uuid();

      mockAnalyticsApi.getUserWatchHistory.mockResolvedValue([
        {
          contentId: completedId,
          contentType: 'MOVIE',
          completionPercentage: 95,
          completed: true,
          lastWatchedAt: new Date(),
          lastWatchedPositionMs: 0,
          totalWatchTimeMs: 100000,
          watchCount: 1,
          firstWatchedAt: new Date(),
        },
        {
          contentId: partialId,
          contentType: 'MOVIE',
          completionPercentage: 50,
          completed: false,
          lastWatchedAt: new Date(),
          lastWatchedPositionMs: 50000,
          totalWatchTimeMs: 100000,
          watchCount: 1,
          firstWatchedAt: new Date(),
        },
      ]);
      mockAnalyticsApi.getUserResumePosition.mockResolvedValue({ positionMs: 50000, completionPercentage: 50 });

      const res = await request(app.getHttpServer())
        .get('/recommendations/continue-watching')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      const ids = res.body.map((i: { contentId: string }) => i.contentId);
      expect(ids).not.toContain(completedId);
      expect(ids).toContain(partialId);
    });

    it('caps continue watching at 20 items (CW-04)', async () => {
      const historyItems = Array.from({ length: 25 }, (_, i) => ({
        contentId: faker.string.uuid(),
        contentType: 'MOVIE',
        completionPercentage: 50,
        completed: false,
        lastWatchedAt: new Date(Date.now() - i * 1000),
        lastWatchedPositionMs: 50000,
        totalWatchTimeMs: 100000,
        watchCount: 1,
        firstWatchedAt: new Date(),
      }));

      mockAnalyticsApi.getUserWatchHistory.mockResolvedValue(historyItems);
      mockAnalyticsApi.getUserResumePosition.mockResolvedValue({ positionMs: 50000, completionPercentage: 50 });

      const res = await request(app.getHttpServer())
        .get('/recommendations/continue-watching')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.length).toBe(20);
    });

    it('excludes dismissed items from continue watching (CW-05)', async () => {
      const dismissedId = faker.string.uuid();
      const activeId = faker.string.uuid();

      const dismiss = continueWatchingDismissFactory.build({ userId: fakeUserId, contentId: dismissedId });
      await testDbClient(Tables.RecommendationsContinueWatchingDismiss).insert(dismiss);

      mockAnalyticsApi.getUserWatchHistory.mockResolvedValue([
        {
          contentId: dismissedId,
          contentType: 'MOVIE',
          completionPercentage: 30,
          completed: false,
          lastWatchedAt: new Date(),
          lastWatchedPositionMs: 30000,
          totalWatchTimeMs: 100000,
          watchCount: 1,
          firstWatchedAt: new Date(),
        },
        {
          contentId: activeId,
          contentType: 'MOVIE',
          completionPercentage: 40,
          completed: false,
          lastWatchedAt: new Date(),
          lastWatchedPositionMs: 40000,
          totalWatchTimeMs: 100000,
          watchCount: 1,
          firstWatchedAt: new Date(),
        },
      ]);
      mockAnalyticsApi.getUserResumePosition.mockResolvedValue({ positionMs: 40000, completionPercentage: 40 });

      const res = await request(app.getHttpServer())
        .get('/recommendations/continue-watching')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      const ids = res.body.map((i: { contentId: string }) => i.contentId);
      expect(ids).not.toContain(dismissedId);
      expect(ids).toContain(activeId);
    });

    it('returns empty array when no partially-watched content (CW-06)', async () => {
      mockAnalyticsApi.getUserWatchHistory.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/recommendations/continue-watching')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toEqual([]);
    });
  });

  // ============================
  // DELETE /recommendations/continue-watching/:contentId
  // ============================

  describe('DELETE /recommendations/continue-watching/:contentId', () => {
    it('dismisses a continue watching item and returns 204 (CW-05)', async () => {
      const contentId = faker.string.uuid();

      const res = await request(app.getHttpServer())
        .delete(`/recommendations/continue-watching/${contentId}`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(HttpStatus.NO_CONTENT);

      const dismiss = await testDbClient(Tables.RecommendationsContinueWatchingDismiss)
        .where({ userId: fakeUserId, contentId })
        .first();
      expect(dismiss).toBeDefined();
    });
  });
});
