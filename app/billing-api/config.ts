import { ConfigException } from '@tlc/shared-module/config';
import { z } from 'zod';

export const configSchema = z.object({
  billingApi: z.object({
    port: z.coerce.number(),
  }),
});

export type BillingApiConfig = z.infer<typeof configSchema>;

export const billingApiFactory = (): BillingApiConfig => {
  const result = configSchema.safeParse({
    billingApi: {
      port: process.env.BILLING_API_PORT,
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(`Invalid application configuration: ${result.error.message}`);
};
