import { Inject, Injectable } from '@nestjs/common';
import { Video } from '@src/module/content/persistence/entity/video.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class VideoRepository extends DefaultTypeOrmRepository<Video> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Video, dataSource);
  }
}
