import { Injectable } from '@nestjs/common';
import { TvShow } from '@src/module/content/persistence/entity/tv-show.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class TvShowRepository extends DefaultTypeOrmRepository<TvShow> {
  constructor(readonly entityManager: EntityManager) {
    super(TvShow, entityManager);
  }
}
