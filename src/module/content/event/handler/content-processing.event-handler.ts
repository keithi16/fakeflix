import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MovieContentModel } from '@src/module/content/core/model/movie-content.model';
import { ContentIndexingService } from '@src/module/content/core/service/content-indexing.service';
import { ContentMedia } from '@src/module/content/persistence/entity/content-media.entity';
import { EntityChangedEvent } from '@src/shared/event/entity-changed.event';

@Injectable()
export class ContentProcessingEventHandler {
  constructor(private readonly contentIndexingService: ContentIndexingService) {}

  @OnEvent('content.processed')
  async handlerContentProcessedEvent(payload: EntityChangedEvent<MovieContentModel>) {
    /**
     * This works as an anti corruption layer, we are transforming the content entity to a content media entity
     * to avoid exposing the content entity to the content streaming module
     */
    const contentMedia = new ContentMedia({
      contentId: payload.entityData.id,
      title: payload.entityData.title,
      description: payload.entityData.description,
      type: payload.entityData.type,
      createdAt: payload.entityData.createdAt,
      updatedAt: payload.entityData.updatedAt,
      movieId: payload.entityData.movie?.id,
      metadata: {
        url: payload.entityData.movie?.video.url,
        duration: payload.entityData.movie?.video.duration,
        sizeInKb: payload.entityData.movie?.video.sizeInKb,
        videoId: payload.entityData.movie?.video.id,
        createdAt: payload.entityData.movie?.video.createdAt,
        updatedAt: payload.entityData.movie?.video.updatedAt,
        thumbnail: payload.entityData.movie?.thumbnail
          ? {
              url: payload.entityData.movie.thumbnail.url,
              thumbnailId: payload.entityData.movie.thumbnail.id,
            }
          : undefined,
      },
    });
    await this.contentIndexingService.indexContent(contentMedia);
  }
}
