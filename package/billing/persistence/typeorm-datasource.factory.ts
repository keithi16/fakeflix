import { BillingConfig } from '@tlc/billing/config';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
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
  entities: ['package/billing/**/*.entity.ts'],
  migrations: ['package/billing/persistence/migration/*-migration.ts'],
  migrationsRun: false,
  migrationsTableName: 'billing_migrations',
  logging: false,
});
