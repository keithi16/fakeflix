// eslint-disable-next-line no-restricted-imports
import {
  configSchema,
  environmentSchema,
} from '@src/shared/module/config/schema/config.schema';
import { z } from 'zod';

export type Environment = z.infer<typeof environmentSchema>;

export type Config = z.infer<typeof configSchema>;
