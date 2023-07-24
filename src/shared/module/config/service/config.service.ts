import { Injectable } from '@nestjs/common';
// eslint-disable-next-line no-restricted-imports
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Config } from '@src/shared/module/config/type/config.type';

/**
 * This service extends the NestConfigService to enforce `WasValidated` to be
 * true. Thus, ensuring `get` method return type will always return a value
 * instead of `T | undefined`
 *
 * See https://github.com/nestjs/config/blob/8f519ac78f9139e0dd4ee26eb97f73344c0237e8/lib/config.service.ts#L34-L35
 */
@Injectable()
export class ConfigService extends NestConfigService<Record<string, unknown>, true> {
  /**
   * Override the `get` method to use the configuration schema to autocomplate
   * the property path and always return the right type.
   *
   * This strict typing validation makes impossible to:
   * 1. Access a property that does not exist in the configuration schema.
   * 2. Cast a property to a different type than the one defined in the
   *    configuration schema.
   */
  get<T extends keyof Config>(propertyPath: T): Config[T] {
    return super.get(propertyPath);
  }
}
