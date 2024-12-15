import { Injectable } from '@nestjs/common';
import { Movie } from '@src/module/content/persistence/entity/movie.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class MovieRepository extends DefaultTypeOrmRepository<Movie> {
  constructor(readonly entityManager: EntityManager) {
    super(Movie, entityManager);
  }
}
