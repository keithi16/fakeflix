import { ConfigService } from '@tlc/shared-module/config';
import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';
import { Config } from '../config';

export const dataSourceOptionsFactory = (
  configService: ConfigService<Config>
): Extract<DataSourceOptions, { type: 'postgres' }> => {
  return {
    type: 'postgres',
    name: 'recommendations',
    host: configService.get('recommendations.database.host'),
    port: configService.get('recommendations.database.port'),
    username: configService.get('recommendations.database.username'),
    password: configService.get('recommendations.database.password'),
    database: configService.get('recommendations.database.database'),
    synchronize: false,
    dropSchema: false,
    entities: [join(__dirname, 'entity', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migration', '*-migration.{ts,js}')],
    migrationsRun: false,
    migrationsTableName: 'recommendations_migrations',
    logging: false,
  };
};
