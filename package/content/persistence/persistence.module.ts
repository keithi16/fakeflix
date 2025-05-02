import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ContentConfig } from '@tlc/content/config';
import { EpisodeRepository } from '@tlc/content/persistence/repository/episode.repository';
import { VideoMetadataRepository } from '@tlc/content/persistence/repository/video-metadata.repository';
import { VideoRepository } from '@tlc/content/persistence/repository/video.repository';
import { dataSourceOptionsFactory } from '@tlc/content/persistence/typeorm-datasource.factory';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm/typeorm-persistence.module';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { ContentRepository } from './repository/content.repository';

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
export class PersistenceModule {}
