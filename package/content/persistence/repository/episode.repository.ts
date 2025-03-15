import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Episode } from '@tlc/content/persistence/entity/episode.entity';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class EpisodeRepository extends DefaultTypeOrmRepository<Episode> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource
  ) {
    super(Episode, dataSource.manager);
  }

  async findByLastEpisodeByTvShowAndSeason(
    tvShowId: string,
    season: number
  ): Promise<Episode | null> {
    return this.findOne({
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
