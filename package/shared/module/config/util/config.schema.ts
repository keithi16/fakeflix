import { z } from 'zod';

export const environmentSchema = z.enum(['test', 'development', 'production']);

const databaseSchema = z.object({
  host: z.string(),
  database: z.string(),
  password: z.string(),
  port: z.coerce.number(),
  url: z.string().startsWith('postgresql://'),
  username: z.string(),
});

const movieDbSchema = z.object({
  apiToken: z.string(),
  url: z.string(),
});

const billingApiSchema = z.object({
  url: z.string(),
  port: z.coerce.number().positive().int(),
});

const monolithSchema = z.object({
  port: z.coerce.number().positive().int(),
});

export const configSchema = z.object({
  env: environmentSchema,
  monolith: monolithSchema,
  database: databaseSchema,
  movieDb: movieDbSchema,
  billingApi: billingApiSchema,
});
