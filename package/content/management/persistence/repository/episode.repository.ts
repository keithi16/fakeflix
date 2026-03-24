import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { Episode } from '../entity/episode.entity';

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
