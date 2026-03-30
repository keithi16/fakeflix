import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsApi, ContentCatalogApi } from '@tlc/shared-module/public-api';
import { PreComputedRecommendationRepository } from '../../../../persistence/repository/pre-computed-recommendation.repository';
import { RecommendationComputationService } from '../../recommendation-computation.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => (_target: unknown, _key: string, descriptor: PropertyDescriptor) => descriptor,
  initializeTransactionalContext: jest.fn(),
}));

describe('RecommendationComputationService', () => {
  let service: RecommendationComputationService;
  let analyticsApi: jest.Mocked<AnalyticsApi>;
  let contentCatalogApi: jest.Mocked<ContentCatalogApi>;
  let preComputedRepo: jest.Mocked<PreComputedRecommendationRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationComputationService,
        {
          provide: AnalyticsApi,
          useValue: {
            getUserGenreAffinities: jest.fn(),
            getUserWatchHistory: jest.fn(),
          },
        },
        {
          provide: ContentCatalogApi,
          useValue: {
            findAllWithGenres: jest.fn(),
          },
        },
        {
          provide: PreComputedRecommendationRepository,
          useValue: {
            replaceForUser: jest.fn().mockResolvedValue(undefined),
            getDistinctUserIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationComputationService>(RecommendationComputationService);
    analyticsApi = module.get(AnalyticsApi);
    contentCatalogApi = module.get(ContentCatalogApi);
    preComputedRepo = module.get(PreComputedRecommendationRepository);
  });

  describe('computeForUser', () => {
    it('scores content matching multiple genres by summing affinity scores', async () => {
      analyticsApi.getUserGenreAffinities.mockResolvedValue([
        { genre: 'Action', affinityScore: 0.8, totalWatchTimeMs: 1000, contentCount: 5 },
        { genre: 'Drama', affinityScore: 0.6, totalWatchTimeMs: 800, contentCount: 3 },
      ]);
      analyticsApi.getUserWatchHistory.mockResolvedValue([]);
      contentCatalogApi.findAllWithGenres.mockResolvedValue([
        { id: 'c1', title: 'Movie A', type: 'movie', genres: ['Action', 'Drama'], releaseDate: null },
        { id: 'c2', title: 'Movie B', type: 'movie', genres: ['Action'], releaseDate: null },
      ]);

      const results = await service.computeForUser('user-1');

      expect(results).toHaveLength(2);
      expect(results[0].contentId).toBe('c1');
      expect(results[0].score).toBeCloseTo(1.4); // 0.8 + 0.6
      expect(results[0].matchedGenres).toEqual(expect.arrayContaining(['Action', 'Drama']));
      expect(results[1].contentId).toBe('c2');
      expect(results[1].score).toBeCloseTo(0.8);
    });

    it('excludes completed content from results', async () => {
      analyticsApi.getUserGenreAffinities.mockResolvedValue([
        { genre: 'Action', affinityScore: 0.9, totalWatchTimeMs: 2000, contentCount: 10 },
      ]);
      analyticsApi.getUserWatchHistory.mockResolvedValue([
        {
          contentId: 'completed-1',
          contentType: 'movie',
          completionPercentage: 100,
          completed: true,
          lastWatchedAt: new Date(),
          lastWatchedPositionMs: 0,
          totalWatchTimeMs: 5000,
          watchCount: 1,
          firstWatchedAt: new Date(),
        },
      ]);
      contentCatalogApi.findAllWithGenres.mockResolvedValue([
        { id: 'completed-1', title: 'Watched Movie', type: 'movie', genres: ['Action'], releaseDate: null },
        { id: 'unwatched-1', title: 'New Movie', type: 'movie', genres: ['Action'], releaseDate: null },
      ]);

      const results = await service.computeForUser('user-1');

      expect(results).toHaveLength(1);
      expect(results[0].contentId).toBe('unwatched-1');
    });

    it('returns empty array when user has no genre affinities', async () => {
      analyticsApi.getUserGenreAffinities.mockResolvedValue([]);
      analyticsApi.getUserWatchHistory.mockResolvedValue([]);
      contentCatalogApi.findAllWithGenres.mockResolvedValue([
        { id: 'c1', title: 'Movie A', type: 'movie', genres: ['Action'], releaseDate: null },
        { id: 'c2', title: 'Movie B', type: 'movie', genres: ['Drama'], releaseDate: null },
      ]);

      const results = await service.computeForUser('user-1');

      expect(results).toHaveLength(0);
    });

    it('returns empty array when catalog is empty', async () => {
      analyticsApi.getUserGenreAffinities.mockResolvedValue([
        { genre: 'Action', affinityScore: 0.9, totalWatchTimeMs: 2000, contentCount: 10 },
      ]);
      analyticsApi.getUserWatchHistory.mockResolvedValue([]);
      contentCatalogApi.findAllWithGenres.mockResolvedValue([]);

      const results = await service.computeForUser('user-1');

      expect(results).toHaveLength(0);
    });

    it('returns fewer than 20 items when catalog has fewer matches', async () => {
      analyticsApi.getUserGenreAffinities.mockResolvedValue([
        { genre: 'Action', affinityScore: 0.7, totalWatchTimeMs: 1000, contentCount: 3 },
      ]);
      analyticsApi.getUserWatchHistory.mockResolvedValue([]);
      contentCatalogApi.findAllWithGenres.mockResolvedValue([
        { id: 'c1', title: 'Movie 1', type: 'movie', genres: ['Action'], releaseDate: null },
        { id: 'c2', title: 'Movie 2', type: 'movie', genres: ['Action'], releaseDate: null },
        { id: 'c3', title: 'Movie 3', type: 'movie', genres: ['Action'], releaseDate: null },
      ]);

      const results = await service.computeForUser('user-1');

      expect(results).toHaveLength(3);
    });

    it('assigns ranks correctly with rank 1 for highest score', async () => {
      analyticsApi.getUserGenreAffinities.mockResolvedValue([
        { genre: 'Action', affinityScore: 0.9, totalWatchTimeMs: 2000, contentCount: 5 },
        { genre: 'Comedy', affinityScore: 0.5, totalWatchTimeMs: 500, contentCount: 2 },
      ]);
      analyticsApi.getUserWatchHistory.mockResolvedValue([]);
      contentCatalogApi.findAllWithGenres.mockResolvedValue([
        { id: 'c1', title: 'Action Only', type: 'movie', genres: ['Action'], releaseDate: null },
        { id: 'c2', title: 'Action Comedy', type: 'movie', genres: ['Action', 'Comedy'], releaseDate: null },
      ]);

      const results = await service.computeForUser('user-1');

      expect(results[0].rank).toBe(1);
      expect(results[0].contentId).toBe('c2'); // 0.9 + 0.5 = 1.4
      expect(results[1].rank).toBe(2);
      expect(results[1].contentId).toBe('c1'); // 0.9
    });

    it('stores results via replaceForUser with correct arguments', async () => {
      analyticsApi.getUserGenreAffinities.mockResolvedValue([
        { genre: 'Action', affinityScore: 0.8, totalWatchTimeMs: 1000, contentCount: 4 },
      ]);
      analyticsApi.getUserWatchHistory.mockResolvedValue([]);
      contentCatalogApi.findAllWithGenres.mockResolvedValue([
        { id: 'c1', title: 'Action Movie', type: 'movie', genres: ['Action'], releaseDate: null },
      ]);

      await service.computeForUser('user-42');

      expect(preComputedRepo.replaceForUser).toHaveBeenCalledWith(
        'user-42',
        expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-42',
            contentId: 'c1',
            score: 0.8,
            rank: 1,
            matchedGenres: ['Action'],
            computedAt: expect.any(Date),
          }),
        ])
      );
    });
  });

  describe('recomputeAll', () => {
    it('calls computeForUser for each distinct userId from repository', async () => {
      preComputedRepo.getDistinctUserIds.mockResolvedValue(['user-1', 'user-2', 'user-3']);
      analyticsApi.getUserGenreAffinities.mockResolvedValue([]);
      analyticsApi.getUserWatchHistory.mockResolvedValue([]);
      contentCatalogApi.findAllWithGenres.mockResolvedValue([]);

      await service.recomputeAll();

      expect(preComputedRepo.replaceForUser).toHaveBeenCalledTimes(3);
      expect(preComputedRepo.replaceForUser).toHaveBeenCalledWith('user-1', []);
      expect(preComputedRepo.replaceForUser).toHaveBeenCalledWith('user-2', []);
      expect(preComputedRepo.replaceForUser).toHaveBeenCalledWith('user-3', []);
    });
  });
});
