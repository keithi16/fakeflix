import { NestFactory } from '@nestjs/core';
import { IdentityConfig, identityConfigFactory } from '../config';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
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
