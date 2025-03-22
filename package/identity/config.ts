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

const identity = z.object({
  database: databaseSchema,
});

export const configSchema = z.object({
  env: environmentSchema,
  identity,
});

export type Environment = z.infer<typeof environmentSchema>;

export type IdentityConfig = z.infer<typeof configSchema>;

export const identityConfigFactory = (): IdentityConfig => {
  const result = configSchema.safeParse({
    env: process.env.NODE_ENV,
    identity: {
      database: {
        host: process.env.IDENTITY_DATABASE_HOST,
        database: process.env.IDENTITY_DATABASE_NAME,
        password: process.env.IDENTITY_DATABASE_PASSWORD,
        port: process.env.IDENTITY_DATABASE_PORT,
        url: `postgresql://${process.env.IDENTITY_DATABASE_USERNAME}:${process.env.IDENTITY_DATABASE_PASSWORD}@${process.env.IDENTITY_DATABASE_HOST}:${process.env.IDENTITY_DATABASE_PORT}/${process.env.IDENTITY_DATABASE_NAME}`,
        username: process.env.IDENTITY_DATABASE_USERNAME,
      },
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(`Invalid application configuration: ${result.error.message}`);
};
