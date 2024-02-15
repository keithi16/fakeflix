import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { DataSourceOptions } from 'typeorm';
import envParser from './config/env-parser';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: async () => {
        return envParser as DataSourceOptions;
      },
    }),
  ],
})
export class TypeOrmPersistenceModule {}
