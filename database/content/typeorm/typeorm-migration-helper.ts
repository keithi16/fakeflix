import { NestFactory } from '@nestjs/core';
import { ContentManagementPersistenceModule } from '@src/module/content/content-management/persistence/content-management-persistence.module';
import { ConfigService } from '@src/shared/module/config/config.service';
import { TypeOrmMigrationService } from '@src/shared/module/persistence/typeorm/service/typeorm-migration.service';
import { DataSourceOptions } from 'typeorm';
import { createPostgresDatabase } from 'typeorm-extension';

export const migrate = async () => {
  const migrationModule = await NestFactory.createApplicationContext(
    ContentManagementPersistenceModule
  );
  migrationModule.init();
  const configService = migrationModule.get<ConfigService>(ConfigService);
  const options = {
    type: 'postgres',
    ...configService.get('database'),
  } as DataSourceOptions;
  await createPostgresDatabase({
    ifNotExist: true,
    options,
  });
  await migrationModule.get(TypeOrmMigrationService).migrate();
};

export const getDataSource = async () => {
  const migrationModule = await NestFactory.createApplicationContext(
    ContentManagementPersistenceModule
  );
  return migrationModule.get(TypeOrmMigrationService).getDataSource();
};
