import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsApi, ContentCatalogApi } from '@tlc/shared-module/public-api';
import { PreComputedRecommendationRepository } from '../../../../persistence/repository/pre-computed-recommendation.repository';
import { RecommendationComputationService } from '../../recommendation-computation.service';
import { PersonalizedRecommendationService } from '../../personalized-recommendation.service';

const makeTrending = () => [
  {
    contentId: 'c1',
    contentType: 'movie',
    rank: 1,
    trendingScore: 0.9,
    viewCount: 1000,
    uniqueViewers: 500,
  },
];

const makeCatalog = () => [
  { id: 'c2', title: 'Movie C2', type: 'movie', genres: ['action'], releaseDate: null },
];

const makePreComputed = () => [
  {
    id: '1',
    userId: 'u1',
    contentId: 'c2',
    score: 0.8,
    rank: 1,
    matchedGenres: ['action'],
    computedAt: new Date(),
  },
];

const makeComputed = () => [
  {
    contentId: 'c3',
    title: 'Movie C3',
    type: 'movie',
    score: 0.7,
    rank: 1,
    matchedGenres: ['drama'],
  },
];

describe('PersonalizedRecommendationService', () => {
  let service: PersonalizedRecommendationService;
  let analyticsApi: jest.Mocked<AnalyticsApi>;
  let contentCatalogApi: jest.Mocked<ContentCatalogApi>;
  let preComputedRepo: jest.Mocked<PreComputedRecommendationRepository>;
  let computationService: jest.Mocked<RecommendationComputationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedRecommendationService,
        {
          provide: AnalyticsApi,
          useValue: {
            getTrendingContent: jest.fn(),
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
            findByUserId: jest.fn(),
          },
        },
        {
          provide: RecommendationComputationService,
          useValue: {
            computeForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PersonalizedRecommendationService>(PersonalizedRecommendationService);
    analyticsApi = module.get(AnalyticsApi);
    contentCatalogApi = module.get(ContentCatalogApi);
    preComputedRepo = module.get(PreComputedRecommendationRepository);
    computationService = module.get(RecommendationComputationService);
  });

  describe('anonymous user (REC-06)', () => {
    it('should return normalized trending content when userId is null', async () => {
      const trending = makeTrending();
      analyticsApi.getTrendingContent.mockResolvedValue(trending);

      const result = await service.getForUser(null);

      expect(analyticsApi.getTrendingContent).toHaveBeenCalledWith('daily', 20);
      expect(preComputedRepo.findByUserId).not.toHaveBeenCalled();
      expect(computationService.computeForUser).not.toHaveBeenCalled();
      expect(result).toEqual([
        {
          contentId: 'c1',
          title: '',
          type: 'movie',
          score: 0.9,
          rank: 1,
          matchedGenres: [],
        },
      ]);
    });
  });

  describe('cache hit', () => {
    it('should return hydrated pre-computed results without calling computation service', async () => {
      const cached = makePreComputed();
      const catalog = makeCatalog();
      preComputedRepo.findByUserId.mockResolvedValue(cached as any);
      contentCatalogApi.findAllWithGenres.mockResolvedValue(catalog);

      const result = await service.getForUser('u1');

      expect(preComputedRepo.findByUserId).toHaveBeenCalledWith('u1');
      expect(contentCatalogApi.findAllWithGenres).toHaveBeenCalled();
      expect(computationService.computeForUser).not.toHaveBeenCalled();
      expect(analyticsApi.getTrendingContent).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        contentId: 'c2',
        title: 'Movie C2',
        type: 'movie',
        score: 0.8,
        rank: 1,
        matchedGenres: ['action'],
      });
    });
  });

  describe('cache miss + compute', () => {
    it('should call computeForUser and return computed results when cache is empty', async () => {
      const computed = makeComputed();
      preComputedRepo.findByUserId.mockResolvedValue([]);
      computationService.computeForUser.mockResolvedValue(computed);

      const result = await service.getForUser('u1');

      expect(preComputedRepo.findByUserId).toHaveBeenCalledWith('u1');
      expect(computationService.computeForUser).toHaveBeenCalledWith('u1');
      expect(result).toEqual(computed);
    });
  });

  describe('new user with no affinities (REC-03)', () => {
    it('should fall back to trending when computeForUser returns empty array', async () => {
      const trending = makeTrending();
      preComputedRepo.findByUserId.mockResolvedValue([]);
      computationService.computeForUser.mockResolvedValue([]);
      analyticsApi.getTrendingContent.mockResolvedValue(trending);

      const result = await service.getForUser('u1');

      expect(computationService.computeForUser).toHaveBeenCalledWith('u1');
      expect(analyticsApi.getTrendingContent).toHaveBeenCalledWith('daily', 20);
      expect(result).toEqual([
        {
          contentId: 'c1',
          title: '',
          type: 'movie',
          score: 0.9,
          rank: 1,
          matchedGenres: [],
        },
      ]);
    });
  });

  describe('analytics error fallback (REC-08)', () => {
    it('should return trending content when analytics API throws', async () => {
      const trending = makeTrending();
      preComputedRepo.findByUserId.mockRejectedValue(new Error('Analytics API unavailable'));
      analyticsApi.getTrendingContent.mockResolvedValue(trending);

      const result = await service.getForUser('u1');

      expect(analyticsApi.getTrendingContent).toHaveBeenCalledWith('daily', 20);
      expect(result).toEqual([
        {
          contentId: 'c1',
          title: '',
          type: 'movie',
          score: 0.9,
          rank: 1,
          matchedGenres: [],
        },
      ]);
    });

    it('should return trending content when computeForUser throws', async () => {
      const trending = makeTrending();
      preComputedRepo.findByUserId.mockResolvedValue([]);
      computationService.computeForUser.mockRejectedValue(new Error('Computation failed'));
      analyticsApi.getTrendingContent.mockResolvedValue(trending);

      const result = await service.getForUser('u1');

      expect(analyticsApi.getTrendingContent).toHaveBeenCalledWith('daily', 20);
      expect(result).toEqual([
        {
          contentId: 'c1',
          title: '',
          type: 'movie',
          score: 0.9,
          rank: 1,
          matchedGenres: [],
        },
      ]);
    });
  });
});
