import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { DataSource } from 'typeorm';
import { billingConfigFactory } from '../billing.module';
import { BillingConfig } from '../config';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

const getDataSource = async () => {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      load: [billingConfigFactory],
    })
  );
  const configService = configModule.get<ConfigService<BillingConfig>>(ConfigService);

  return new DataSource(dataSourceOptionsFactory(configService));
};

export default getDataSource();
