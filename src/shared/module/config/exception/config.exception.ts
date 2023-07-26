import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '@src/shared/exception/application.exception';
import { Environment } from '@src/shared/module/config/type/config.type';
import { z } from 'zod';

export class ConfigException extends ApplicationException {}

export class InvalidConfigException extends ConfigException {
  readonly env: Environment;
  readonly zodError: z.ZodError;

  constructor(error: z.ZodError, env: Environment) {
    // Shows a pretty version of the schema errors for the underlying
    // environment.  Useful to know if issues are from `.env` or `.env.test`.
    super({
      message: `Invalid configuration for environment "${env}" ${error.message}`,
      suggestedHttpStatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      context: { env, error },
    });

    this.env = env;
    this.zodError = error;
  }
}

export class UndefinedEnvironmentException extends ConfigException {
  constructor() {
    super({
      message: 'NODE_ENV environment variable is undefined',
      suggestedHttpStatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
