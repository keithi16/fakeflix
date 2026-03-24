import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigService } from '@tlc/shared-module/config';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { ContentConfig } from '../../config';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

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
  providers: [],
  exports: [],
})
export class ContentSharedPersistenceModule {}
