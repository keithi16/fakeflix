import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ContentMediaRepository } from '@tlc/content/persistence/repository/content-media.repository';
import { EpisodeRepository } from '@tlc/content/persistence/repository/episode.repository';
import { dataSourceOptionsFactory } from '@tlc/content/persistence/typeorm-datasource';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { DynamoDBPersistenceModule } from '@tlc/shared-module/dynamodb/dynamodb.module';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm/typeorm-persistence.module';
import { ContentRepository } from './repository/content.repository';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'content',
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return dataSourceOptionsFactory(configService);
      },
    }),
    EventEmitterModule,
    DynamoDBPersistenceModule,
    ConfigModule.forRoot(),
  ],
  providers: [ContentRepository, EpisodeRepository, ContentMediaRepository],
  exports: [ContentRepository, EpisodeRepository, ContentMediaRepository],
})
export class PersistenceModule {}
