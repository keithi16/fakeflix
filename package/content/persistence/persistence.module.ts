import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ContentConfig } from '@tlc/content/config';
import { EpisodeRepository } from '@tlc/content/persistence/repository/episode.repository';
import { VideoRepository } from '@tlc/content/persistence/repository/video.repository';
import { dataSourceOptionsFactory } from '@tlc/content/persistence/typeorm-datasource.factory';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm/typeorm-persistence.module';
import { ContentRepository } from './repository/content.repository';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'content',
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ContentConfig>) => {
        return dataSourceOptionsFactory(configService);
      },
    }),
    EventEmitterModule,
  ],
  providers: [ContentRepository, EpisodeRepository, VideoRepository],
  exports: [ContentRepository, EpisodeRepository, VideoRepository],
})
export class PersistenceModule {}
