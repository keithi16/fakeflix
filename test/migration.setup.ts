import 'tsconfig-paths/register';
import { migrate } from '../database/typeorm/typeorm-migration.helper';

export default async () => {
  await migrate();
};
