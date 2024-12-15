import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentType } from '@src/module/content/core/enum/content-type.enum';
import { AgeRecommendationService } from '@src/module/content/core/service/age-recommendation.service';
import { ContentDistributionService } from '@src/module/content/core/service/content-distribution.service';
import { VideoMetadataService } from '@src/module/content/core/service/video-metadata.service';
import { VideoProfanityFilterService } from '@src/module/content/core/service/video-profanity-filter.service';
import { ExternalMovieRatingClient } from '@src/module/content/http/client/external-movie-rating/external-movie-rating.client';
import { CreateEpisodeRequestDto } from '@src/module/content/http/rest/dto/request/create-episode.dto';
import { Content } from '@src/module/content/persistence/entity/content.entity';
import { Episode } from '@src/module/content/persistence/entity/episode.entity';
import { Movie } from '@src/module/content/persistence/entity/movie.entity';
import { Thumbnail } from '@src/module/content/persistence/entity/thumbnail.entity';
import { TvShow } from '@src/module/content/persistence/entity/tv-show.entity';
import { Video } from '@src/module/content/persistence/entity/video.entity';
import { ContentRepository } from '@src/module/content/persistence/repository/content.repository';
import { EpisodeRepository } from '@src/module/content/persistence/repository/episode.repository';
import { TransactionManagerService } from '@src/module/content/persistence/transaction-manager.service';
import { NotFoundDomainException } from '@src/shared/core/exeption/not-found-domain.exception';
import { ContentManagementOperationType } from '@src/shared/event/content/content-management.event';
import { EntityChangedEvent } from '@src/shared/event/entity-changed.event';
import { EventEmitterService } from '@src/shared/module/event/service/event-emitter.service';
import { AppLogger } from '@src/shared/module/logger/service/app-logger.service';

export interface ExternalMovieRating {
  rating: number;
}

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly contentRepository: ContentRepository,
    /**
     * TODO wrap the event emitter into our own service
     * To allow easy swapping of the event emitter library
     */
    private readonly eventEmitter: EventEmitterService,
    private readonly externalMovieRatingClient: ExternalMovieRatingClient,
    private readonly episodeRepository: EpisodeRepository,
    private readonly ageRecommendationProvider: AgeRecommendationService,
    private readonly transactionManager: TransactionManagerService,
    private readonly videoMetadataProvider: VideoMetadataService,
    private readonly contendDistributionService: ContentDistributionService,
    private readonly videoProfanityFilterService: VideoProfanityFilterService,
    private readonly appLogger: AppLogger
  ) {}

  async createMovie(video: {
    //TODO add userId
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    sizeInKb: number;
  }): Promise<Content> {
    const externalRating = await this.externalMovieRatingClient.getRating(video.title);
    const contentModel = new Content({
      title: video.title,
      description: video.description,
      type: ContentType.MOVIE,
      movie: new Movie({
        externalRating: externalRating ?? null,
        video: new Video({
          url: video.videoUrl,
          duration: video.duration,
          sizeInKb: video.sizeInKb,
        }),
      }),
    });

    if (video.thumbnailUrl) {
      contentModel.movie.thumbnail = new Thumbnail({
        url: video.thumbnailUrl,
      });
    }
    const content = await this.contentRepository.save(contentModel);
    this.eventEmitter.emit(
      ContentManagementOperationType.CONTENT_CREATED,
      new EntityChangedEvent(
        ContentManagementOperationType.CONTENT_CREATED,
        content.id,
        content
      )
    );
    this.appLogger.log(`Created movie with id ${content.id}`, {
      contentBody: content,
    });
    return content;
  }

  async createTvShow(tvShow: {
    //TODO add userId
    title: string;
    description: string;
    thumbnailUrl?: string;
  }): Promise<Content> {
    const content = new Content({
      title: tvShow.title,
      description: tvShow.description,
      type: ContentType.TV_SHOW,
      tvShow: new TvShow({}),
    });

    if (tvShow.thumbnailUrl && content.tvShow) {
      content.tvShow.thumbnail = new Thumbnail({
        url: tvShow.thumbnailUrl,
      });
    }
    return await this.contentRepository.save(content);
  }

  async createEpisode(
    episodeData: CreateEpisodeRequestDto & {
      videoUrl: string;
      tvShowId: string;
      videoSizeInKb: number;
    }
  ): Promise<Episode> {
    //Problem: Requires too many repositories
    const content = await this.contentRepository.findOneById(episodeData.tvShowId, [
      'tvShow',
    ]);
    if (!content?.tvShow) {
      throw new NotFoundDomainException(
        `TV Show with id ${episodeData.tvShowId} not found`
      );
    }
    //Domain logic validation
    const episodeWithSameSeasonAndNumber = await this.episodeRepository.existsBy({
      season: episodeData.season,
      number: episodeData.number,
      tvShowId: episodeData.tvShowId,
    });
    if (episodeWithSameSeasonAndNumber) {
      throw new BadRequestException(
        `Episode with season ${episodeData.season} and number ${episodeData.number} already exists`
      );
    }

    const lastEpisode = await this.episodeRepository.findByLastEpisodeByTvShowAndSeason(
      episodeData.tvShowId,
      episodeData.season
    );
    if (lastEpisode && lastEpisode.number + 1 !== episodeData.number) {
      throw new BadRequestException(`Episode number should be ${lastEpisode.number + 1}`);
    }

    //!Episode cannot be loaded with tvShow because of the number of records
    const episode = new Episode({
      title: episodeData.title,
      description: episodeData.description,
      season: episodeData.season,
      number: episodeData.number,
      tvShow: content.tvShow,
      video: new Video({
        url: episodeData.videoUrl,
        duration: await this.videoMetadataProvider.getVideoDurantaion(
          episodeData.videoUrl
        ),
        sizeInKb: episodeData.videoSizeInKb,
      }),
    });

    //assume it's async and will update the video later
    //TODO: implement the video profanity filter save non transactional
    await this.videoProfanityFilterService.filterProfanity(episode.video);

    const ageRecommendation =
      await this.ageRecommendationProvider.getAgeRecommendationForContent(
        episodeData.videoUrl
      );

    content.ageRecommendation = ageRecommendation;

    //Perform transactional operation
    return await this.transactionManager.executeWithinTransaction(async () => {
      await this.contentRepository.save(content);

      const savedEpisode = await this.episodeRepository.save(episode);
      //If it fails the transaction is rolled back
      await this.contendDistributionService.distributeContent(content.id);
      return savedEpisode;
    });
  }
}
