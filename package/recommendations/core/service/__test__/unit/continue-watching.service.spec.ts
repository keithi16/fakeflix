import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsApi } from '@tlc/shared-module/public-api';
import { ContinueWatchingDismissRepository } from '../../../../persistence/repository/continue-watching-dismiss.repository';
import { ContinueWatchingItem, ContinueWatchingService } from '../../continue-watching.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => (_target: unknown, _key: string, descriptor: PropertyDescriptor) => descriptor,
  initializeTransactionalContext: jest.fn(),
}));

const makeHistoryItem = (
  contentId: string,
  completionPercentage: number,
  lastWatchedAt: Date,
) => ({
  contentId,
  contentType: 'movie',
  lastWatchedPositionMs: 1000,
  totalWatchTimeMs: 5000,
  completionPercentage,
  completed: false,
  watchCount: 1,
  firstWatchedAt: new Date('2024-01-01'),
  lastWatchedAt,
});

describe('ContinueWatchingService', () => {
  let service: ContinueWatchingService;
  let analyticsApi: jest.Mocked<AnalyticsApi>;
  let dismissRepository: jest.Mocked<ContinueWatchingDismissRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContinueWatchingService,
        {
          provide: AnalyticsApi,
          useValue: {
            getUserWatchHistory: jest.fn(),
            getUserResumePosition: jest.fn(),
          },
        },
        {
          provide: ContinueWatchingDismissRepository,
          useValue: {
            findByUserId: jest.fn(),
            dismiss: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContinueWatchingService>(ContinueWatchingService);
    analyticsApi = module.get(AnalyticsApi);
    dismissRepository = module.get(ContinueWatchingDismissRepository);
  });

  describe('getForUser', () => {
    it('filters out items with completionPercentage <= 5 and >= 90', async () => {
      analyticsApi.getUserWatchHistory.mockResolvedValue([
        makeHistoryItem('c1', 5, new Date('2024-01-05')),   // excluded: <= 5
        makeHistoryItem('c2', 6, new Date('2024-01-04')),   // included
        makeHistoryItem('c3', 89, new Date('2024-01-03')),  // included
        makeHistoryItem('c4', 90, new Date('2024-01-02')),  // excluded: >= 90
        makeHistoryItem('c5', 100, new Date('2024-01-01')), // excluded: >= 90
      ]);
      dismissRepository.findByUserId.mockResolvedValue([]);
      analyticsApi.getUserResumePosition.mockResolvedValue({ positionMs: 500, completionPercentage: 50 });

      const result = await service.getForUser('user-1');

      const ids = result.map((r: ContinueWatchingItem) => r.contentId);
      expect(ids).toContain('c2');
      expect(ids).toContain('c3');
      expect(ids).not.toContain('c1');
      expect(ids).not.toContain('c4');
      expect(ids).not.toContain('c5');
    });

    it('excludes dismissed items', async () => {
      analyticsApi.getUserWatchHistory.mockResolvedValue([
        makeHistoryItem('c1', 50, new Date('2024-01-03')),
        makeHistoryItem('c2', 60, new Date('2024-01-02')),
      ]);
      dismissRepository.findByUserId.mockResolvedValue([
        { contentId: 'c1', userId: 'user-1', dismissedAt: new Date() } as any,
      ]);
      analyticsApi.getUserResumePosition.mockResolvedValue({ positionMs: 500, completionPercentage: 60 });

      const result = await service.getForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].contentId).toBe('c2');
    });

    it('sorts results by lastWatchedAt descending', async () => {
      analyticsApi.getUserWatchHistory.mockResolvedValue([
        makeHistoryItem('old', 50, new Date('2024-01-01')),
        makeHistoryItem('newest', 50, new Date('2024-03-01')),
        makeHistoryItem('middle', 50, new Date('2024-02-01')),
      ]);
      dismissRepository.findByUserId.mockResolvedValue([]);
      analyticsApi.getUserResumePosition.mockResolvedValue(null);

      const result = await service.getForUser('user-1');

      expect(result[0].contentId).toBe('newest');
      expect(result[1].contentId).toBe('middle');
      expect(result[2].contentId).toBe('old');
    });

    it('limits results to 20 items', async () => {
      const history = Array.from({ length: 25 }, (_, i) =>
        makeHistoryItem(`c${i}`, 50, new Date(2024, 0, i + 1)),
      );
      analyticsApi.getUserWatchHistory.mockResolvedValue(history);
      dismissRepository.findByUserId.mockResolvedValue([]);
      analyticsApi.getUserResumePosition.mockResolvedValue(null);

      const result = await service.getForUser('user-1');

      expect(result).toHaveLength(20);
    });

    it('enriches each item with resume position from analyticsApi', async () => {
      analyticsApi.getUserWatchHistory.mockResolvedValue([
        makeHistoryItem('c1', 50, new Date('2024-01-01')),
      ]);
      dismissRepository.findByUserId.mockResolvedValue([]);
      analyticsApi.getUserResumePosition.mockResolvedValue({ positionMs: 12345, completionPercentage: 50 });

      const result = await service.getForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].resumePositionMs).toBe(12345);
      expect(analyticsApi.getUserResumePosition).toHaveBeenCalledWith('user-1', 'c1');
    });

    it('returns 0 for resumePositionMs when getUserResumePosition returns null', async () => {
      analyticsApi.getUserWatchHistory.mockResolvedValue([
        makeHistoryItem('c1', 50, new Date('2024-01-01')),
      ]);
      dismissRepository.findByUserId.mockResolvedValue([]);
      analyticsApi.getUserResumePosition.mockResolvedValue(null);

      const result = await service.getForUser('user-1');

      expect(result[0].resumePositionMs).toBe(0);
    });

    it('returns empty array when watch history is empty (CW-06)', async () => {
      analyticsApi.getUserWatchHistory.mockResolvedValue([]);
      dismissRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getForUser('user-1');

      expect(result).toEqual([]);
    });

    it('returns empty array when analytics API throws (REC-08)', async () => {
      analyticsApi.getUserWatchHistory.mockRejectedValue(new Error('Analytics unavailable'));

      const result = await service.getForUser('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('dismissItem', () => {
    it('calls dismissRepository.dismiss with correct userId and contentId (CW-05)', async () => {
      dismissRepository.dismiss.mockResolvedValue(undefined);

      await service.dismissItem('user-1', 'content-42');

      expect(dismissRepository.dismiss).toHaveBeenCalledWith('user-1', 'content-42');
    });
  });
});
