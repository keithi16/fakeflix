import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { VideoMetadata } from '../../../shared/persistence/entity/video-metadata.entity';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class VideoMetadataRepository extends DefaultTypeOrmRepository<VideoMetadata> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource
  ) {
    super(VideoMetadata, dataSource.manager);
  }
}
