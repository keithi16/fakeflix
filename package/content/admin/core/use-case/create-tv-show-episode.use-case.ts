import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@tlc/shared-lib/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { runInTransaction } from 'typeorm-transactional';
import { Episode } from '../../../shared/persistence/entity/episode.entity';
import { Video } from '../../../shared/persistence/entity/video.entity';
import { CreateEpisodeRequestDto } from '../../http/rest/dto/request/create-episode.dto';
import { ContentRepository } from '../../persistence/repository/content.repository';
import { EpisodeRepository } from '../../persistence/repository/episode.repository';
import { ContentDistributionService } from '../service/content-distribution.service';
import { EpisodeLifecycleService } from '../service/episode-lifecycle.service';
import { VideoProcessorService } from '../service/video-processor.service';

@Injectable()
export class CreateTvShowEpisodeUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly episodeRepository: EpisodeRepository,
    private readonly contentDistributionService: ContentDistributionService,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly episodeLifecycleService: EpisodeLifecycleService,
    private readonly logger: AppLogger
  ) {}
  async execute(
    episodeData: CreateEpisodeRequestDto & {
      videoUrl: string;
      contentId: string;
      videoSizeInKb: number;
    }
  ): Promise<Episode> {
    const tvShowContent = await this.contentRepository.findTvShowContentById(
      episodeData.contentId
    );
    if (!tvShowContent) {
      throw new NotFoundDomainException(
        `TV Show with id ${episodeData.contentId} not found`
      );
    }

    // Episodes não são carregados junto com TvShow por questões de performance
    // (um TvShow pode ter centenas de episódios)
    const episode = new Episode({
      title: episodeData.title,
      description: episodeData.description,
      season: episodeData.season,
      number: episodeData.number,
      tvShowId: tvShowContent.id,
    });

    const video = new Video({
      url: episodeData.videoUrl,
      sizeInKb: episodeData.videoSizeInKb,
    });

    episode.video = video;

    // Valida regras de negócio antes de persistir
    await this.episodeLifecycleService.checkEpisodeConstraintsOrThrow(episode);

    return await runInTransaction(
      async () => {
        // Salva o episode diretamente - TypeORM gerencia a FK automaticamente
        const savedEpisode = await this.episodeRepository.save(episode);
        await this.videoProcessorService.processMetadataAndModeration(video);
        await this.contentDistributionService.distributeContent(tvShowContent.id);
        this.logger.log(
          `Added episode with id ${savedEpisode.id} to tvShow ${tvShowContent.id}`,
          {
            contentBody: savedEpisode,
          }
        );
        return savedEpisode;
      },
      {
        connectionName: 'content',
      }
    );
  }
}
