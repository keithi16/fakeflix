import { z } from 'zod';

export const environmentSchema = z.enum(['test', 'development', 'production']);

export const configSchema = z.object({
  NODE_ENV: environmentSchema,
  PORT: z.coerce.number().positive().int(),
  DATABASE_URL: z.string().url(),
});
