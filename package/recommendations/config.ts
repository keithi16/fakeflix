import { ConfigException, environmentSchema } from '@tlc/shared-module/config';
import { z } from 'zod';

const databaseSchema = z.object({
  host: z.string(),
  database: z.string(),
  password: z.string(),
  port: z.coerce.number(),
  url: z.string().startsWith('postgresql://'),
  username: z.string(),
});

const redisSchema = z.object({
  host: z.string(),
  port: z.coerce.number(),
  password: z.string().optional(),
});

const recommendationsSchema = z.object({
  database: databaseSchema,
  redis: redisSchema,
});

export const configSchema = z.object({
  env: environmentSchema,
  recommendations: recommendationsSchema,
});

export type Config = z.infer<typeof configSchema>;

export const factory = (): Config => {
  const result = configSchema.safeParse({
    env: process.env.NODE_ENV,
    recommendations: {
      database: {
        host: process.env.RECOMMENDATIONS_DATABASE_HOST,
        database: process.env.RECOMMENDATIONS_DATABASE_NAME,
        password: process.env.RECOMMENDATIONS_DATABASE_PASSWORD,
        port: process.env.RECOMMENDATIONS_DATABASE_PORT,
        url: `postgresql://${encodeURIComponent(process.env.RECOMMENDATIONS_DATABASE_USERNAME ?? '')}:${encodeURIComponent(process.env.RECOMMENDATIONS_DATABASE_PASSWORD ?? '')}@${process.env.RECOMMENDATIONS_DATABASE_HOST}:${process.env.RECOMMENDATIONS_DATABASE_PORT}/${process.env.RECOMMENDATIONS_DATABASE_NAME}`,
        username: process.env.RECOMMENDATIONS_DATABASE_USERNAME,
      },
      redis: {
        host: process.env.RECOMMENDATIONS_REDIS_HOST ?? 'localhost',
        port: process.env.RECOMMENDATIONS_REDIS_PORT ?? 6379,
        password: process.env.RECOMMENDATIONS_REDIS_PASSWORD,
      },
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(`Invalid application configuration: ${result.error.message}`);
};
