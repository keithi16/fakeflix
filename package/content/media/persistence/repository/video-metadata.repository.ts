import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { VideoMetadata } from '../entity/video-metadata.entity';
import { Video } from '../entity/video.entity';

@Injectable()
export class VideoMetadataRepository extends DefaultTypeOrmRepository<VideoMetadata> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource
  ) {
    super(VideoMetadata, dataSource.manager);
  }

  async findByVideo(video: Video): Promise<VideoMetadata | null> {
    return this.findOne({ where: { video } });
  }
}
