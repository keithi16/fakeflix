import { Module } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AnalyticsConfig } from '../../config';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

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
  providers: [],
  exports: [],
})
export class AnalyticsSharedPersistenceModule {}
