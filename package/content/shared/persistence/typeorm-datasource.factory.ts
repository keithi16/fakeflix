import { ConfigService } from '@tlc/shared-module/config';
import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';
import { ContentConfig } from '../../config';

export const dataSourceOptionsFactory = (
  configService: ConfigService<ContentConfig>
): Extract<DataSourceOptions, { type: 'postgres' }> => ({
  type: 'postgres',
  name: 'content',
  host: configService.get('content.database.host'),
  port: 5432,
  username: configService.get('content.database.username'),
  password: configService.get('content.database.password'),
  database: configService.get('content.database.database'),
  synchronize: false,
  entities: [
    join(__dirname, 'entity', '*.entity.{ts,js}'),
    join(__dirname, '..', '..', 'management', 'persistence', 'entity', '*.entity.{ts,js}'),
    join(__dirname, '..', '..', 'media', 'persistence', 'entity', '*.entity.{ts,js}'),
  ],
  migrations: [join(__dirname, 'migration', '*-migration.{ts,js}')],
  migrationsRun: false,
  migrationsTableName: 'content_migrations',
  logging: false,
  extra: {
    bigNumberStrings: false,
  },
});
