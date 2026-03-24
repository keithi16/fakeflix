import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { IngestionReadFacade } from '../../../ingestion/public-api/facade/ingestion-read.facade';
import { GenreAffinityRepository } from '../../persistence/repository/genre-affinity.repository';
import { UserWatchHistoryRepository } from '../../persistence/repository/user-watch-history.repository';

@Injectable()
export class GenreAffinityService {
  constructor(
    private readonly genreAffinityRepository: GenreAffinityRepository,
    private readonly watchHistoryRepository: UserWatchHistoryRepository,
    private readonly ingestionReadFacade: IngestionReadFacade,
    private readonly logger: AppLogger
  ) {}

  @Transactional({ connectionName: 'analytics' })
  async recomputeAll(): Promise<void> {
    this.logger.log('Starting genre affinity recomputation');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHistory = await this.watchHistoryRepository.findActiveSince(thirtyDaysAgo);
    const recentEvents = await this.ingestionReadFacade.findEventsWithGenresSince(thirtyDaysAgo);

    // Build a (userId:contentId) -> Set<genre> map from event metadata
    const contentGenreMap = new Map<string, Set<string>>();
    for (const event of recentEvents) {
      const key = `${event.userId}:${event.contentId}`;
      let genres = contentGenreMap.get(key);
      if (!genres) {
        genres = new Set<string>();
        contentGenreMap.set(key, genres);
      }
      for (const genre of (event.metadata?.genres as string[] | undefined) ?? []) {
        genres.add(genre);
      }
    }

    const genreStats = new Map<
      string,
      Map<string, { totalWatchTimeMs: number; contentCount: number }>
    >();

    for (const h of recentHistory) {
      const key = `${h.userId}:${h.contentId}`;
      const genres = contentGenreMap.get(key);
      if (!genres || genres.size === 0) continue;

      let userGenres = genreStats.get(h.userId);
      if (!userGenres) {
        userGenres = new Map();
        genreStats.set(h.userId, userGenres);
      }

      for (const genre of genres) {
        let stat = userGenres.get(genre);
        if (!stat) {
          stat = { totalWatchTimeMs: 0, contentCount: 0 };
          userGenres.set(genre, stat);
        }
        stat.totalWatchTimeMs += Number(h.totalWatchTimeMs);
        stat.contentCount += 1;
      }
    }

    for (const [userId, genres] of genreStats.entries()) {
      const maxWatchTime = Math.max(...Array.from(genres.values()).map((g) => g.totalWatchTimeMs));
      const maxCount = Math.max(...Array.from(genres.values()).map((g) => g.contentCount));

      for (const [genre, stats] of genres.entries()) {
        const watchTimeScore = maxWatchTime > 0 ? (stats.totalWatchTimeMs / maxWatchTime) * 70 : 0;
        const countScore = maxCount > 0 ? (stats.contentCount / maxCount) * 30 : 0;
        const affinityScore = Math.min(100, watchTimeScore + countScore);

        await this.genreAffinityRepository.upsertByUserAndGenre(userId, genre, {
          affinityScore,
          totalWatchTimeMs: stats.totalWatchTimeMs,
          contentCount: stats.contentCount,
          lastUpdatedAt: new Date(),
        });
      }
    }

    this.logger.log('Genre affinity recomputation complete');
  }
}
