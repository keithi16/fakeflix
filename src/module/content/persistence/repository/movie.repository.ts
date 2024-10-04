import { Inject, Injectable } from '@nestjs/common';
import { Movie } from '@src/module/content/persistence/entity/movie.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class MovieRepository extends DefaultTypeOrmRepository<Movie> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Movie, dataSource);
  }
}
