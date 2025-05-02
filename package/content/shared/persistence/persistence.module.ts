import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EpisodeRepository } from '@tlc/content/admin/persistence/repository/episode.repository';
import { ContentConfig } from '@tlc/content/config';
import { dataSourceOptionsFactory } from '@tlc/content/shared/persistence/typeorm-datasource.factory';
import { VideoMetadataRepository } from '@tlc/content/video-processor/persistence/repository/video-metadata.repository';
import { VideoRepository } from '@tlc/content/video-processor/persistence/repository/video.repository';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm/typeorm-persistence.module';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { ContentRepository } from '../../admin/persistence/repository/content.repository';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'content',
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ContentConfig>) => {
        return dataSourceOptionsFactory(configService);
      },
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource({
          name: options.name,
          dataSource: new DataSource(options),
        });
      },
    }),
    EventEmitterModule,
  ],
  providers: [
    ContentRepository,
    EpisodeRepository,
    VideoRepository,
    VideoMetadataRepository,
  ],
  exports: [
    ContentRepository,
    EpisodeRepository,
    VideoRepository,
    VideoMetadataRepository,
  ],
})
export class ContentSharedPersistenceModule {}
