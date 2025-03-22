import { ConfigException } from '@tlc/shared-module/config/util/config.exception';
import { environmentSchema } from '@tlc/shared-module/config/util/shared.config';
import { z } from 'zod';

const databaseSchema = z.object({
  host: z.string(),
  database: z.string(),
  password: z.string(),
  port: z.coerce.number(),
  url: z.string().startsWith('postgresql://'),
  username: z.string(),
});

const content = z.object({
  database: databaseSchema,
  movieDb: z.object({
    apiToken: z.string(),
    url: z.string(),
  }),
});

export const configSchema = z.object({
  env: environmentSchema,
  content,
});

export type ContentConfig = z.infer<typeof configSchema>;

export type Config = z.infer<typeof configSchema>;

export const contentConfigFactory = (): Config => {
  const result = configSchema.safeParse({
    env: process.env.NODE_ENV,
    content: {
      database: {
        host: process.env.CONTENT_DATABASE_HOST,
        database: process.env.CONTENT_DATABASE_NAME,
        password: process.env.CONTENT_DATABASE_PASSWORD,
        port: process.env.CONTENT_DATABASE_PORT,
        url: `postgresql://${process.env.CONTENT_DATABASE_USERNAME}:${process.env.CONTENT_DATABASE_PASSWORD}@${process.env.CONTENT_DATABASE_HOST}:${process.env.CONTENT_DATABASE_PORT}/${process.env.CONTENT_DATABASE_NAME}`,
        username: process.env.CONTENT_DATABASE_USERNAME,
      },
      movieDb: {
        apiToken: process.env.CONTENT_MOVIEDB_API_TOKEN,
        url: process.env.CONTENT_MOVIEDB_BASE_URL,
      },
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(`Invalid application configuration: ${result.error.message}`);
};
