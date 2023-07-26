/* eslint-disable no-restricted-imports */
import { DynamicModule } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigModuleOptions as NestConfigModuleOptions,
} from '@nestjs/config';
import { configSchema } from './schema/config.schema';
import { ConfigService } from './service/config.service';
import { getEnv, validate } from './util/config.util';

export class ConfigModule extends NestConfigModule {
  static forRoot(options?: NestConfigModuleOptions): DynamicModule {
    const env = getEnv();

    const module = NestConfigModule.forRoot({
      ...options,
      validate: validate(env, configSchema),
    });

    if (module.providers) {
      module.providers.push(ConfigService);
    } else {
      module.providers = [ConfigService];
    }

    if (module.exports) {
      module.exports.push(ConfigService);
    } else {
      module.exports = [ConfigService];
    }

    return module;
  }
}
