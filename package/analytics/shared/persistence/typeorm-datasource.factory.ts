import { ConfigService } from '@tlc/shared-module/config';
import { join } from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AnalyticsConfig } from '../../config';

export const dataSourceOptionsFactory = (
  configService: ConfigService<AnalyticsConfig>
): PostgresConnectionOptions => {
  return {
    type: 'postgres',
    name: 'analytics',
    host: configService.get('analytics.database.host'),
    port: configService.get('analytics.database.port'),
    username: configService.get('analytics.database.username'),
    password: configService.get('analytics.database.password'),
    database: configService.get('analytics.database.database'),
    synchronize: false,
    dropSchema: false,
    entities: [
      join(__dirname, '..', '..', 'ingestion', 'persistence', 'entity', '*.entity.{ts,js}'),
      join(__dirname, '..', '..', 'aggregation', 'persistence', 'entity', '*.entity.{ts,js}'),
    ],
    migrations: [join(__dirname, 'migration', '*-migration.{ts,js}')],
    migrationsRun: false,
    migrationsTableName: 'analytics_migrations',
    logging: false,
  };
};
