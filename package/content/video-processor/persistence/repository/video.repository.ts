import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Video } from '@tlc/content/shared/persistence/entity/video.entity';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class VideoRepository extends DefaultTypeOrmRepository<Video> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource
  ) {
    super(Video, dataSource.manager);
  }
}
