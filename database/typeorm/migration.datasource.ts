// eslint-disable-next-line no-restricted-imports
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
config();

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST'),
  port: 5432,
  username: configService.get<string>('DATABASE_USERNAME'),
  password: configService.get<string>('DATABASE_PASSWORD'),
  database: configService.get<string>('DATABASE_NAME'),
  synchronize: false,
  entities: [
    'src/module/content/**/*.entity.ts',
    'src/module/billing/**/*.entity.ts',
    'src/module/identity/**/*.entity.ts',
  ],
  migrations: ['database/typeorm/migration/*-migration.ts'],
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;
