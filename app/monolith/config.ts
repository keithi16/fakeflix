import { ConfigException } from '@tlc/shared-module/config/util/config.exception';
import { z } from 'zod';

export const configSchema = z.object({
  monolithApi: z.object({
    port: z.coerce.number(),
  }),
});

export type MonolithApiConfig = z.infer<typeof configSchema>;

export const monolithApiConfigFactory = (): MonolithApiConfig => {
  const result = configSchema.safeParse({
    monolithApi: {
      port: process.env.MONOLITH_API_PORT,
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(`Invalid application configuration: ${result.error.message}`);
};
