import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { PreComputedRecommendation } from '../entity/pre-computed-recommendation.entity';

@Injectable()
export class PreComputedRecommendationRepository extends DefaultTypeOrmRepository<PreComputedRecommendation> {
  constructor(
    @InjectDataSource('recommendations')
    dataSource: DataSource
  ) {
    super(PreComputedRecommendation, dataSource.manager);
  }

  async findByUserId(userId: string): Promise<PreComputedRecommendation[]> {
    return this.find({ where: { userId }, order: { rank: 'ASC' } });
  }

  async replaceForUser(
    userId: string,
    items: Omit<PreComputedRecommendation, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[]
  ): Promise<void> {
    await this.transactionalEntityManager.delete(PreComputedRecommendation, { userId });
    if (items.length > 0) {
      await this.transactionalEntityManager.save(
        PreComputedRecommendation,
        items.map((item) => new PreComputedRecommendation({ ...item })),
      );
    }
  }

  async getDistinctUserIds(): Promise<string[]> {
    const results = await this.transactionalEntityManager
      .getRepository(PreComputedRecommendation)
      .createQueryBuilder('r')
      .select('DISTINCT r.userId', 'userId')
      .getRawMany<{ userId: string }>();
    return results.map((r) => r.userId);
  }
}
