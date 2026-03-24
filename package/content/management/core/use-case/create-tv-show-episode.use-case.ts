import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@tlc/shared-lib/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { Episode } from '../../persistence/entity/episode.entity';
import { MediaFacade } from '../../../media/public-api/facade/media.facade';
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
    private readonly mediaFacade: MediaFacade,
    private readonly logger: AppLogger
  ) {}

  @Transactional({ connectionName: 'content' })
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

    // Valida regras de negócio antes de persistir
    await this.episodeLifecycleService.checkEpisodeConstraintsOrThrow(episode);

    const { videoId } = await this.mediaFacade.createVideo(
      episodeData.videoUrl,
      episodeData.videoSizeInKb
    );

    episode.videoId = videoId;

    const savedEpisode = await this.episodeRepository.save(episode);
    await this.videoProcessorService.processMetadataAndModeration(videoId, episodeData.videoUrl);
    await this.contentDistributionService.distributeContent(tvShowContent.id);

    const episodeWithVideo = await this.episodeRepository.findOne({
      where: { id: savedEpisode.id },
      relations: ['video'],
    });

    if (!episodeWithVideo) {
      throw new Error(`Failed to load episode with id ${savedEpisode.id} after saving`);
    }

    this.logger.log(
      `Added episode with id ${savedEpisode.id} to tvShow ${tvShowContent.id}`,
      {
        contentBody: savedEpisode,
      }
    );
    return episodeWithVideo;
  }
}
