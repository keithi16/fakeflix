import { Injectable } from '@nestjs/common';
import { Episode } from '@src/module/content/persistence/entity/episode.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class EpisodeRepository extends DefaultTypeOrmRepository<Episode> {
  constructor(readonly transactionalEntityManager: EntityManager) {
    super(Episode, transactionalEntityManager);
  }

  async findByLastEpisodeByTvShowAndSeason(
    tvShowId: string,
    season: number
  ): Promise<Episode | null> {
    return this.find({
      where: {
        tvShowId,
        season,
      },
      order: {
        number: 'DESC',
      },
    });
  }
}
