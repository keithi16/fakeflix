import { IdentityConfig } from '../config';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { join } from 'path';
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
  entities: [join(__dirname, 'entity', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migration', '*-migration.{ts,js}')],
  migrationsRun: false,
  migrationsTableName: 'identity_migrations',
  logging: false,
});
