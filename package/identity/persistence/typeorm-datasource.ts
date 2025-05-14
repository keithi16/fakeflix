import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { IdentityConfig, identityConfigFactory } from '../config';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';
config();

const getDataSource = async () => {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      load: [identityConfigFactory],
    })
  );
  const configService = configModule.get<ConfigService<IdentityConfig>>(ConfigService);
  return new DataSource(dataSourceOptionsFactory(configService));
};

export default getDataSource();
