import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { DataSource } from 'typeorm';
import { recommendationsConfigFactory } from '../recommendations.module';
import { Config } from '../config';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

const getDataSource = async () => {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      load: [recommendationsConfigFactory],
    })
  );
  const configService = configModule.get<ConfigService<Config>>(ConfigService);

  return new DataSource(dataSourceOptionsFactory(configService));
};

export default getDataSource();
