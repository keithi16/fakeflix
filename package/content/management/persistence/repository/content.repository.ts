import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource, FindOptionsWhere, IsNull, Not } from 'typeorm';
import { ContentType } from '../../../shared/core/enum/content-type.enum';
import { Content, MovieContent, TvShowContent } from '../../../shared/core';
import { isMovieContent, isTvShowContent } from '../../../shared/core';
import { PublishingStatus } from '../../../shared/core/enum/publishing-status.enum';

export interface StatusCount {
  publishingStatus: PublishingStatus;
  count: string;
}

export interface StatusAndTypeCount {
  publishingStatus: PublishingStatus;
  type: ContentType;
  count: string;
}

@Injectable()
export class ContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource
  ) {
    super(Content, dataSource.manager);
  }

  async save(content: Content): Promise<Content> {
    if (isTvShowContent(content) && content.episodes) {
      const episodes = content.episodes;
      const savedContent = await super.save(content);

      if (Array.isArray(episodes) && episodes.length > 0) {
        await this.transactionalEntityManager.save(episodes);
      }

      return savedContent;
    }

    return await super.save(content);
  }

  async saveMovieContent(content: MovieContent): Promise<MovieContent> {
    const saved = await this.save(content);

    const movieContent = await this.findMovieContentById(saved.id);
    if (!movieContent) {
      throw new Error(`Failed to properly save movie content with id ${saved.id}`);
    }

    return movieContent;
  }

  async saveTvShowContent(content: TvShowContent): Promise<TvShowContent> {
    const saved = await this.save(content);

    const tvShowContent = await this.findTvShowContentById(saved.id);
    if (!tvShowContent) {
      throw new Error(`Failed to properly save tv show content with id ${saved.id}`);
    }

    return tvShowContent;
  }

  async findMovieContentById(id: string): Promise<MovieContent | null> {
    const content = await this.findOne({
      where: { id, type: ContentType.MOVIE },
      relations: ['video', 'thumbnail'],
    });

    return isMovieContent(content) ? content : null;
  }

  async findTvShowContentById(
    id: string,
    additionalRelations?: string[]
  ): Promise<TvShowContent | null> {
    const defaultRelations = ['thumbnail'];
    const allRelations = additionalRelations
      ? [...defaultRelations, ...additionalRelations]
      : defaultRelations;

    const content = await this.findOne({
      where: { id, type: ContentType.TV_SHOW },
      relations: allRelations,
    });

    return isTvShowContent(content) ? content : null;
  }

  async findAllWithOptionalStatusFilter(statuses?: PublishingStatus[], scheduledOnly?: boolean): Promise<Content[]> {
    if (statuses && statuses.length > 0) {
      const where = statuses.map(s => {
        const clause: FindOptionsWhere<Content> = { publishingStatus: s };
        if (scheduledOnly) clause.scheduledPublishAt = Not(IsNull());
        return clause;
      });
      return this.find({ where });
    }
    const where: FindOptionsWhere<Content> = {};
    if (scheduledOnly) where.scheduledPublishAt = Not(IsNull());
    return this.find({ where });
  }

  async findContentByIdWithRelations(id: string): Promise<Content | null> {
    return this.findOne({ where: { id } as never });
  }

  async countByPublishingStatus(): Promise<StatusCount[]> {
    return this.transactionalEntityManager
      .createQueryBuilder(Content, 'content')
      .select('content.publishingStatus', 'publishingStatus')
      .addSelect('COUNT(*)', 'count')
      .groupBy('content.publishingStatus')
      .getRawMany<StatusCount>();
  }

  async countByPublishingStatusAndContentType(): Promise<StatusAndTypeCount[]> {
    return this.transactionalEntityManager
      .createQueryBuilder(Content, 'content')
      .select('content.publishingStatus', 'publishingStatus')
      .addSelect('content.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('content.publishingStatus')
      .addGroupBy('content.type')
      .getRawMany<StatusAndTypeCount>();
  }

  async findContentByVideoId(videoId: string): Promise<Content | null> {
    const movieContent = await this.transactionalEntityManager
      .createQueryBuilder(MovieContent, 'content')
      .leftJoinAndSelect('content.thumbnail', 'thumbnail')
      .where('content.videoId = :videoId', { videoId })
      .getOne();

    if (movieContent) {
      return movieContent;
    }

    const tvShowContent = await this.transactionalEntityManager
      .createQueryBuilder(TvShowContent, 'content')
      .innerJoin('content.episodes', 'episode')
      .leftJoinAndSelect('content.thumbnail', 'thumbnail')
      .where('episode.videoId = :videoId', { videoId })
      .getOne();

    return tvShowContent;
  }
}
