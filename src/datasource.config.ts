import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });

console.log(process.env.DATABASE_HOST);
console.log(__dirname);
const config = {
  type: 'postgres',
  host: `localhost`,
  port: `5432`,
  username: `postgres`,
  password: `postgres`,
  database: `test`,
  entities: ['**/*.model.ts'],
  migrations: ['../migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: false,
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
