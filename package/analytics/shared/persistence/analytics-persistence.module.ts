import { Module } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AnalyticsConfig } from '../../config';
import { BingeSessionRepository } from './repository/binge-session.repository';
import { ContentPerformanceRepository } from './repository/content-performance.repository';
import { GenreAffinityRepository } from './repository/genre-affinity.repository';
import { HeartbeatRepository } from './repository/heartbeat.repository';
import { TrendingContentRepository } from './repository/trending-content.repository';
import { UserWatchHistoryRepository } from './repository/user-watch-history.repository';
import { ViewEventRepository } from './repository/view-event.repository';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

const repositories = [
  ViewEventRepository,
  HeartbeatRepository,
  UserWatchHistoryRepository,
  ContentPerformanceRepository,
  TrendingContentRepository,
  BingeSessionRepository,
  GenreAffinityRepository,
];

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'analytics',
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AnalyticsConfig>) => {
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
  ],
  providers: [...repositories],
  exports: [...repositories],
})
export class AnalyticsSharedPersistenceModule {}
