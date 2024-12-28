import { Injectable } from '@nestjs/common';
import { AgeRecommendationService } from '@src/module/content/core/service/age-recommendation.service';
import { ContentDistributionService } from '@src/module/content/core/service/content-distribution.service';
import { EpisodeLifecycleService } from '@src/module/content/core/service/episode-lifecycle.service';
import { VideoProcessorService } from '@src/module/content/core/service/video-processor.service';
import { CreateEpisodeRequestDto } from '@src/module/content/http/rest/dto/request/create-episode.dto';
import { Episode } from '@src/module/content/persistence/entity/episode.entity';
import { Video } from '@src/module/content/persistence/entity/video.entity';
import { ContentRepository } from '@src/module/content/persistence/repository/content.repository';
import { TransactionManagerService } from '@src/module/content/persistence/transaction-manager.service';
import { NotFoundDomainException } from '@src/shared/core/exeption/not-found-domain.exception';

@Injectable()
export class CreateTvShowEpisodeUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly ageRecommendationService: AgeRecommendationService,
    private readonly transactionManager: TransactionManagerService,
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

    //Perform transactional operation
    await this.transactionManager.executeWithinTransaction(async () => {
      //should try to use only one repository
      await this.contentRepository.saveTvShow(content);

      //If it fails the transaction is rolled back
      await this.contendDistributionService.distributeContent(content.id);
    });
    return episode;
  }
}
