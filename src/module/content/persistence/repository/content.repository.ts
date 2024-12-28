import { Injectable } from '@nestjs/common';
import { MovieContentModel } from '@src/module/content/core/model/movie-content.model';
import { TvShowContentModel } from '@src/module/content/core/model/tv-show-content.model';
import { Content } from '@src/module/content/persistence/entity/content.entity';
import { NotFoundDomainException } from '@src/shared/core/exeption/not-found-domain.exception';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class ContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(readonly transactionalEntityManager: EntityManager) {
    super(Content, transactionalEntityManager);
  }

  async saveMovie(entity: MovieContentModel): Promise<MovieContentModel> {
    const content = new Content({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      movie: entity.movie,
    });
    await super.save(content);

    if (!content.movie) {
      throw new NotFoundDomainException(`Movie not found for content ${content.id}`);
    }
    return new MovieContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      movie: content.movie,
      ageRecommendation: content.ageRecommendation,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
    });
  }
  async saveTvShow(entity: TvShowContentModel): Promise<TvShowContentModel> {
    const episodes = entity.tvShow.episodes;
    //Saves content and tvShow but skips the episodes
    const content = new Content({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      ageRecommendation: entity.ageRecommendation,
      releaseDate: entity.releaseDate,
      tvShow: entity.tvShow,
    });

    await super.save(content);
    //saves the relations from the ManyToOne relationship side to avoid replacement
    if (Array.isArray(episodes) && episodes.length > 0) {
      await this.transactionalEntityManager.save(episodes);
    }

    if (!content.tvShow) {
      throw new NotFoundDomainException(`Tv show not found for content ${content.id}`);
    }
    return new TvShowContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      tvShow: content.tvShow,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
    });
  }

  async findTvShowContentById(
    id: string,
    relations: string[]
  ): Promise<TvShowContentModel | null> {
    const content = await super.findOneById(id, relations);

    //Ensure the content is the type tvShow
    if (!content || !content.tvShow) {
      return null;
    }

    return new TvShowContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
      tvShow: content.tvShow,
    });
  }
}
