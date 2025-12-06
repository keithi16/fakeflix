import { ConfigService } from '@tlc/shared-module/config';
import { join } from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { BillingConfig } from '../../config';

export const dataSourceOptionsFactory = (
  configService: ConfigService<BillingConfig>
): PostgresConnectionOptions => {

  const entities = [join(__dirname, '..', '..', '**', '*.entity.{ts,js}')];
  
  return {
    type: 'postgres',
    name: 'billing',
    host: configService.get('billing.database.host'),
    port: 5432,
    username: configService.get('billing.database.username'),
    password: configService.get('billing.database.password'),
    database: configService.get('billing.database.database'),
    synchronize: false,
    dropSchema: false, 
    entities,
    migrations: [join(__dirname, 'migration', '*-migration.{ts,js}')],
    migrationsRun: false,
    migrationsTableName: 'billing_migrations',
    logging: false,
  };
};
