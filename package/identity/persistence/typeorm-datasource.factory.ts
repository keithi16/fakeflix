import { IdentityConfig } from '@tlc/identity/config';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const dataSourceOptionsFactory = (
  configService: ConfigService<IdentityConfig>
): PostgresConnectionOptions => ({
  type: 'postgres',
  name: 'identity',
  host: configService.get('identity.database.host'),
  port: 5432,
  username: configService.get('identity.database.username'),
  password: configService.get('identity.database.password'),
  database: configService.get('identity.database.database'),
  synchronize: false,
  entities: ['package/identity/**/*.entity.ts'],
  migrations: ['package/identity/persistence/migration/*-migration.ts'],
  migrationsRun: false,
  migrationsTableName: 'identity_migrations',
  logging: false,
});
