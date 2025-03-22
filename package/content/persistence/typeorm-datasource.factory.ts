import { ContentConfig } from '@tlc/content/config';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
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
  entities: ['package/content/**/*.entity.ts'],
  migrations: ['package/content/persistence/migration/*-migration.ts'],
  migrationsRun: false,
  migrationsTableName: 'content_migrations',
  logging: false,
});
