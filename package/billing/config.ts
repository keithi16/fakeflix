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

const billing = z.object({
  database: databaseSchema,
});

export const configSchema = z.object({
  env: environmentSchema,
  billing,
});

export type Environment = z.infer<typeof environmentSchema>;

export type BillingConfig = z.infer<typeof configSchema>;

export type Config = z.infer<typeof configSchema>;

export const factory = (): Config => {
  const result = configSchema.safeParse({
    env: process.env.NODE_ENV,
    billing: {
      database: {
        host: process.env.BILLING_DATABASE_HOST,
        database: process.env.BILLING_DATABASE_NAME,
        password: process.env.BILLING_DATABASE_PASSWORD,
        port: process.env.BILLING_DATABASE_PORT,
        url: `postgresql://${process.env.BILLING_DATABASE_USERNAME}:${process.env.BILLING_DATABASE_PASSWORD}@${process.env.BILLING_DATABASE_HOST}:${process.env.BILLING_DATABASE_PORT}/${process.env.BILLING_DATABASE_NAME}`,
        username: process.env.BILLING_DATABASE_USERNAME,
      },
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(`Invalid application configuration: ${result.error.message}`);
};
