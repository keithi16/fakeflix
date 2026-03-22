import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { DataSource } from 'typeorm';
import { analyticsConfigFactory } from '../../analytics.module';
import { AnalyticsConfig } from '../../config';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

const getDataSource = async () => {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      load: [analyticsConfigFactory],
    })
  );
  const configService = configModule.get<ConfigService<AnalyticsConfig>>(ConfigService);

  return new DataSource(dataSourceOptionsFactory(configService));
};

export default getDataSource();
