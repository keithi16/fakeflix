import { BadRequestException, Injectable } from '@nestjs/common';
import { Episode } from '@src/module/content/persistence/entity/episode.entity';
import { EpisodeRepository } from '@src/module/content/persistence/repository/episode.repository';

@Injectable()
export class EpisodeLifecycleService {
  constructor(private readonly episodeRepository: EpisodeRepository) {}

  async checkEpisodeConstraintsOrThrow(episode: Episode) {
    //Domain logic validation
    const episodeWithSameSeasonAndNumber = await this.episodeRepository.existsBy({
      season: episode.season,
      number: episode.number,
      tvShowId: episode.tvShow.id,
    });
    if (episodeWithSameSeasonAndNumber) {
      //this is not a domain exception
      throw new BadRequestException(
        `Episode with season ${episode.season} and number ${episode.number} already exists`
      );
    }

    const lastEpisode = await this.episodeRepository.findByLastEpisodeByTvShowAndSeason(
      episode.tvShow.contentId,
      episode.season
    );
    if (lastEpisode && lastEpisode.number + 1 !== episode.number) {
      throw new BadRequestException(`Episode number should be ${lastEpisode.number + 1}`);
    }
  }
}
