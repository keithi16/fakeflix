import { BillingConfig } from '../config';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { join } from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const dataSourceOptionsFactory = (
  configService: ConfigService<BillingConfig>
): PostgresConnectionOptions => ({
  type: 'postgres',
  name: 'billing',
  host: configService.get('billing.database.host'),
  port: 5432,
  username: configService.get('billing.database.username'),
  password: configService.get('billing.database.password'),
  database: configService.get('billing.database.database'),
  synchronize: false,
  entities: [join(__dirname, 'entity', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migration', '*-migration.{ts,js}')],
  migrationsRun: false,
  migrationsTableName: 'billing_migrations',
  logging: false,
});
