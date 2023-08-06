import {
  InvalidConfigException,
  UndefinedEnvironmentException,
} from '@src/shared/module/config/exception/config.exception';
import { environmentSchema } from '@src/shared/module/config/schema/config.schema';
import { Environment } from '@src/shared/module/config/type/config.type';
import { z } from 'zod';

export const getEnv = (): Environment => {
  if (!process.env.NODE_ENV) {
    throw new UndefinedEnvironmentException();
  }

  return environmentSchema.parse(process.env.NODE_ENV);
};

export const validate =
  (env: Environment, configSchema: z.AnyZodObject) => (config: Record<string, any>) => {
    try {
      return configSchema.parse(config);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        throw new InvalidConfigException(error, env);
      }

      throw error;
    }
  };

export const getEnvFile = (env: Environment): string => {
  if (env === environmentSchema.Enum.test) {
    return '.env.test';
  }

  return '.env';
};
