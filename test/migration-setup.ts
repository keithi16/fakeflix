import { migrate } from '@database/content/typeorm/typeorm-migration-helper';

beforeAll(async () => {
  await migrate();
});
