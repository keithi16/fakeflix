import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
config();

const getDataSource = async () => {
  const configModule = await NestFactory.createApplicationContext(ConfigModule.forRoot());
  const configService = configModule.get<ConfigService>(ConfigService);
  return new DataSource(dataSourceOptionsFactory(configService));
};

export const dataSourceOptionsFactory = (
  configService: ConfigService
): PostgresConnectionOptions => ({
  type: 'postgres',
  name: 'identity',
  host: configService.get('database.host'),
  port: 5432,
  username: configService.get('database.username'),
  password: configService.get('database.password'),
  database: configService.get('database.database'),
  synchronize: false,
  entities: ['package/identity/**/*.entity.ts'],
  migrations: ['package/identity/persistence/migration/*-migration.ts'],
  migrationsRun: false,
  migrationsTableName: 'identity_migrations',
  logging: false,
});

export default getDataSource();
