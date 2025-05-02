import { ContentConfig } from '@tlc/content/config';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { join } from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const dataSourceOptionsFactory = (
  configService: ConfigService<ContentConfig>
): PostgresConnectionOptions => ({
  type: 'postgres',
  name: 'content',
  host: configService.get('content.database.host'),
  port: 5432,
  username: configService.get('content.database.username'),
  password: configService.get('content.database.password'),
  database: configService.get('content.database.database'),
  synchronize: false,
  entities: [join(__dirname, 'entity', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migration', '*-migration.{ts,js}')],
  migrationsRun: false,
  migrationsTableName: 'content_migrations',
  logging: false,
});
