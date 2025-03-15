import { Injectable } from '@nestjs/common';
import { AgeRecommendationService } from '@tlc/content/core/service/age-recommendation.service';
import { ContentDistributionService } from '@tlc/content/core/service/content-distribution.service';
import { EpisodeLifecycleService } from '@tlc/content/core/service/episode-lifecycle.service';
import { VideoProcessorService } from '@tlc/content/core/service/video-processor.service';
import { CreateEpisodeRequestDto } from '@tlc/content/http/rest/dto/request/create-episode.dto';
import { Episode } from '@tlc/content/persistence/entity/episode.entity';
import { Video } from '@tlc/content/persistence/entity/video.entity';
import { ContentRepository } from '@tlc/content/persistence/repository/content.repository';
import { NotFoundDomainException } from '@tlc/shared-lib/core/exeption/not-found-domain.exception';

@Injectable()
export class CreateTvShowEpisodeUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly ageRecommendationService: AgeRecommendationService,
    private readonly contendDistributionService: ContentDistributionService,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly episodeLifecycleService: EpisodeLifecycleService
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

    //TODO add status to the video
    const video = new Video({
      url: episodeData.videoUrl,
      sizeInKb: episodeData.videoSizeInKb,
    });

    Promise.all([
      await this.videoProcessorService.processMetadataAndSecurity(video),
      await this.ageRecommendationService.setAgeRecommendationForContent(content),
    ]);

    episode.video = video;
    content.tvShow.episodes = [];
    content.tvShow.episodes.push(episode);

    await this.contentRepository.saveTvShow(content);
    await this.contendDistributionService.distributeContent(content.id);

    return episode;
  }
}
