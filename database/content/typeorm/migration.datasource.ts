import { registerAs } from '@nestjs/config';
import envParser from '@src/shared/module/persistence/typeorm/config/env-parser';
import { resolve } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

console.log(
  'envParser',
  resolve(__dirname, '../../../src/module/content/content-management/persistence/model')
);
const newConfig = Object.assign({}, envParser, {
  entities: [
    resolve(__dirname, '../../../src/module/content/content-management/**/*.model.ts'),
  ],
  migrations: [resolve(__dirname, './migrations/*.ts')],
  logging: true,
});

export default registerAs('typeorm', () => newConfig);
export const connectionSource = new DataSource(newConfig as DataSourceOptions);
