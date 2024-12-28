import { DynamicModule, Module } from '@nestjs/common';
import { ContentMediaRepository } from '@src/module/content/persistence/repository/content-media.repository';
import { EpisodeRepository } from '@src/module/content/persistence/repository/episode.repository';
import { TransactionManagerService } from '@src/module/content/persistence/transaction-manager.service';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { EventEmitterModule } from '@src/shared/module/event/event-emitter.module';
import { DynamoDBPersistenceModule } from '@src/shared/module/persistence/dynamodb/dynamodb.module';
import { TypeOrmPersistenceModule } from '@src/shared/module/persistence/typeorm/typeorm-persistence.module';
import { DataSource } from 'typeorm';
import { Content } from './entity/content.entity';
import { Episode } from './entity/episode.entity';
import { Movie } from './entity/movie.entity';
import { Thumbnail } from './entity/thumbnail.entity';
import { TvShow } from './entity/tv-show.entity';
import { Video } from './entity/video.entity';
import { ContentRepository } from './repository/content.repository';

@Module({})
export class PersistenceModule {
  static forRoot(opts?: { migrations?: string[] }): DynamicModule {
    const { migrations } = opts || {};
    return {
      module: PersistenceModule,
      imports: [
        TypeOrmPersistenceModule.forRoot({
          migrations,
          entities: [Content, Movie, Thumbnail, Video, TvShow, Episode],
        }),
        EventEmitterModule,
        DynamoDBPersistenceModule,
        ConfigModule.forRoot(),
      ],
      providers: [
        {
          provide: ContentRepository,
          useFactory: (dataSource: DataSource) => {
            return new ContentRepository(dataSource.manager);
          },
          inject: [DataSource],
        },
        {
          provide: EpisodeRepository,
          useFactory: (dataSource: DataSource) => {
            return new EpisodeRepository(dataSource.manager);
          },
          inject: [DataSource],
        },
        ContentMediaRepository,
        TransactionManagerService,
      ],
      exports: [
        ContentRepository,
        EpisodeRepository,
        ContentMediaRepository,
        TransactionManagerService,
      ],
    };
  }
}
