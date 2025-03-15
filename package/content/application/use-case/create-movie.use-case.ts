import { Injectable } from '@nestjs/common';
import { MovieContentModel } from '@tlc/content/core/model/movie-content.model';
import { AgeRecommendationService } from '@tlc/content/core/service/age-recommendation.service';
import { VideoProcessorService } from '@tlc/content/core/service/video-processor.service';
import { ExternalMovieRatingClient } from '@tlc/content/http/client/external-movie-rating/external-movie-rating.client';
import { Movie } from '@tlc/content/persistence/entity/movie.entity';
import { Thumbnail } from '@tlc/content/persistence/entity/thumbnail.entity';
import { Video } from '@tlc/content/persistence/entity/video.entity';
import { ContentRepository } from '@tlc/content/persistence/repository/content.repository';
import { ContentManagementOperationType } from '@tlc/shared-lib/event/content/content-management.event';
import { EntityChangedEvent } from '@tlc/shared-lib/event/entity-changed.event';
import { EventEmitterService } from '@tlc/shared-module/event/service/event-emitter.service';
import { AppLogger } from '@tlc/shared-module/logger/service/app-logger.service';

export interface ExternalMovieRating {
  rating: number;
}

@Injectable()
export class CreateMovieUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    /**
     * TODO wrap the event emitter into our own service
     * To allow easy swapping of the event emitter library
     */
    private readonly eventEmitter: EventEmitterService,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly ageRecommendationService: AgeRecommendationService,
    private readonly externalMovieRatingClient: ExternalMovieRatingClient,

    private readonly appLogger: AppLogger
  ) {}

  async execute(video: {
    //TODO add userId
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    sizeInKb: number;
  }): Promise<MovieContentModel> {
    const externalRating = await this.externalMovieRatingClient.getRating(video.title);
    const contentModel = new MovieContentModel({
      title: video.title,
      description: video.description,
      ageRecommendation: null,
      movie: new Movie({
        externalRating: externalRating ?? null,
        video: new Video({
          url: video.videoUrl,
          sizeInKb: video.sizeInKb,
        }),
      }),
    });

    if (video.thumbnailUrl) {
      contentModel.movie.thumbnail = new Thumbnail({
        url: video.thumbnailUrl,
      });
    }

    Promise.all([
      await this.videoProcessorService.processMetadataAndSecurity(
        contentModel.movie.video
      ),
      await this.ageRecommendationService.setAgeRecommendationForContent(contentModel),
    ]);
    const content = await this.contentRepository.saveMovie(contentModel);
    /**
     * Atenção NUNCA USE EVENT EMITTER EM PRODUÇÃO PARA COMUNICAÇÃO
     * Utilize um Event Broker como SNS ou Kafka pois EventEmitter não persiste eventos.
     * Esse é somente um experimento que no futuro vai virar uma comunicação utilizando um broker de verdade
     * Saiba mais sobre isso aqui https://youtu.be/7D-EB_VpLRQ?si=X04R8FTchSr0_WuV
     */
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
}
