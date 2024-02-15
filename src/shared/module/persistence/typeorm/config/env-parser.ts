import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

const dbConnectionString = process.env.DATABASE_URL;
if (!dbConnectionString) {
  throw new Error('DATABASE_URL is not set');
}

const splitConnectionString = dbConnectionString.split('/');
const database = splitConnectionString[3];
const [host, port] = splitConnectionString[2].split('@')[1].split(':');
const [username, password] = splitConnectionString[2].split('@')[0].split(':');
export default {
  type: 'postgres',
  host,
  port: parseInt(port),
  username,
  password,
  database,
  logging: false,
  autoLoadEntities: true,
  migrationsTableName: 'typeorm_migrations',
};
