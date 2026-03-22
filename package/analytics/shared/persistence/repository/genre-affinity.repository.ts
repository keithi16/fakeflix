import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { AnalyticsGenreAffinity } from '../entity/analytics-genre-affinity.entity';

@Injectable()
export class GenreAffinityRepository extends DefaultTypeOrmRepository<AnalyticsGenreAffinity> {
  constructor(@InjectDataSource('analytics') dataSource: DataSource) {
    super(AnalyticsGenreAffinity, dataSource.manager);
  }

  async findByUser(userId: string): Promise<AnalyticsGenreAffinity[]> {
    return this.transactionalEntityManager
      .getRepository(AnalyticsGenreAffinity)
      .find({ where: { userId }, order: { affinityScore: 'DESC' } });
  }

  async findByUserAndGenre(
    userId: string,
    genre: string
  ): Promise<AnalyticsGenreAffinity | null> {
    return this.findOne({ where: { userId, genre } });
  }

  async upsertByUserAndGenre(
    userId: string,
    genre: string,
    updates: Partial<AnalyticsGenreAffinity>
  ): Promise<AnalyticsGenreAffinity> {
    let entry = await this.findByUserAndGenre(userId, genre);
    if (!entry) {
      entry = new AnalyticsGenreAffinity({ userId, genre, ...updates });
    } else {
      Object.assign(entry, updates);
    }
    return this.save(entry);
  }
}
