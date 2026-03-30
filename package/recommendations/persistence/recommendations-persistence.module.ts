import { Module } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { Config } from '../config';
import { PreComputedRecommendationRepository } from './repository/pre-computed-recommendation.repository';
import { ContinueWatchingDismissRepository } from './repository/continue-watching-dismiss.repository';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

const repositories = [PreComputedRecommendationRepository, ContinueWatchingDismissRepository];

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'recommendations',
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config>) => {
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
export class RecommendationsPersistenceModule {}
