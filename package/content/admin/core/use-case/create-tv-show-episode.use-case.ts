import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@tlc/shared-lib/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { runInTransaction } from 'typeorm-transactional';
import { Episode } from '../../../shared/persistence/entity/episode.entity';
import { Video } from '../../../shared/persistence/entity/video.entity';
import { CreateEpisodeRequestDto } from '../../http/rest/dto/request/create-episode.dto';
import { ContentRepository } from '../../persistence/repository/content.repository';
import { ContentDistributionService } from '../service/content-distribution.service';
import { EpisodeLifecycleService } from '../service/episode-lifecycle.service';
import { VideoProcessorService } from '../service/video-processor.service';

@Injectable()
export class CreateTvShowEpisodeUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly contendDistributionService: ContentDistributionService,
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
    //Problem: Requires too many repositories
    const content = await this.contentRepository.findTvShowContentById(
      episodeData.contentId,
      ['tvShow']
    );
    if (!content?.tvShow) {
      throw new NotFoundDomainException(
        `TV Show with id ${episodeData.contentId} not found`
      );
    }
    //!Episode cannot be loaded with tvShow because of the number of records
    //Episode can only be loaded if video is ready
    const episode = new Episode({
      title: episodeData.title,
      description: episodeData.description,
      season: episodeData.season,
      number: episodeData.number,
      tvShow: content.tvShow,
    });

    await this.episodeLifecycleService.checkEpisodeConstraintsOrThrow(episode);

    const video = new Video({
      url: episodeData.videoUrl,
      sizeInKb: episodeData.videoSizeInKb,
    });

    episode.video = video;
    content.tvShow.episodes = [];
    content.tvShow.episodes.push(episode);

    await this.contentRepository.saveMovieOrTvShow(content);
    await this.videoProcessorService.processMetadataAndModeration(video);

    return await runInTransaction(
      async () => {
        await this.contentRepository.saveMovieOrTvShow(content);
        await this.videoProcessorService.processMetadataAndModeration(video);
        await this.contendDistributionService.distributeContent(content.id);
        this.logger.log(
          `Added episode with id ${episode.id} to tvShow ${content.tvShow.id}`,
          {
            contentBody: content,
          }
        );
        return episode;
      },
      {
        connectionName: 'content',
      }
    );
  }
}
