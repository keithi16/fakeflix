import { NestFactory } from '@nestjs/core';
import { billingConfigFactory } from '@tlc/billing/billing.module';
import { BillingConfig } from '@tlc/billing/config';
import { dataSourceOptionsFactory } from '@tlc/billing/persistence/typeorm-datasource.factory';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { DataSource } from 'typeorm';

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
