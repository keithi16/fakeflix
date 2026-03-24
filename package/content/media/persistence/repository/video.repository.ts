import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { Video } from '../entity/video.entity';

@Injectable()
export class VideoRepository extends DefaultTypeOrmRepository<Video> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource
  ) {
    super(Video, dataSource.manager);
  }
}
