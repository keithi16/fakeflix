import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ContentType } from '@tlc/content/core/enum/content-type.enum';
import { MovieContentModel } from '@tlc/content/core/model/movie-content.model';
import { TvShowContentModel } from '@tlc/content/core/model/tv-show-content.model';
import { Content } from '@tlc/content/persistence/entity/content.entity';
import { NotFoundDomainException } from '@tlc/shared-lib/core/exeption/not-found-domain.exception';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class ContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource
  ) {
    super(Content, dataSource.manager);
  }

  async saveMovieOrTvShow(entity: MovieContentModel): Promise<MovieContentModel>;
  async saveMovieOrTvShow(entity: TvShowContentModel): Promise<TvShowContentModel>;
  async saveMovieOrTvShow(
    entity: MovieContentModel | TvShowContentModel
  ): Promise<MovieContentModel | TvShowContentModel>;
  async saveMovieOrTvShow(
    entity: MovieContentModel | TvShowContentModel
  ): Promise<MovieContentModel | TvShowContentModel> {
    if (entity.type === ContentType.MOVIE) {
      return this.saveMovie(entity as MovieContentModel);
    }
    if (entity.type === ContentType.TV_SHOW) {
      return this.saveTvShow(entity as TvShowContentModel);
    }
    throw new NotFoundDomainException(`Content type ${entity.type} not found`);
  }

  private async saveMovie(entity: MovieContentModel): Promise<MovieContentModel> {
    const content = new Content({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      ageRecommendation: entity.ageRecommendation,
      type: entity.type,
      movie: entity.movie,
    });
    const savedContent = await super.save(content);

    if (!savedContent.movie) {
      throw new NotFoundDomainException(`Movie not found for content ${savedContent.id}`);
    }
    return this.mapToMovieContentModel(savedContent);
  }
  private async saveTvShow(entity: TvShowContentModel): Promise<TvShowContentModel> {
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
    return this.mapToTvShowContentModel(content);
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

    return this.mapToTvShowContentModel(content);
  }

  async findContentByVideoId(
    videoId: string
  ): Promise<TvShowContentModel | MovieContentModel | null> {
    const content = await this.transactionalEntityManager
      .createQueryBuilder(Content, 'content')
      .leftJoinAndSelect('content.movie', 'movie')
      .leftJoinAndSelect('movie.video', 'movieVideo')
      .leftJoinAndSelect('content.tvShow', 'tvShow')
      .leftJoinAndSelect('tvShow.episodes', 'episode')
      .leftJoinAndSelect('episode.video', 'episodeVideo')
      .where('movieVideo.id = :videoId OR episodeVideo.id = :videoId', { videoId })
      .getOne();

    if (!content || (!content.movie && !content.tvShow)) {
      return null;
    }
    if (content.tvShow) {
      return this.mapToTvShowContentModel(content);
    }
    if (content.movie) {
      return this.mapToMovieContentModel(content);
    }
    return null;
  }

  private mapToMovieContentModel(content: Content): MovieContentModel {
    return new MovieContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      ageRecommendation: content.ageRecommendation,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
      movie: content.movie!,
    });
  }
  private mapToTvShowContentModel(content: Content): TvShowContentModel {
    return new TvShowContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
      tvShow: content.tvShow!,
    });
  }
}
