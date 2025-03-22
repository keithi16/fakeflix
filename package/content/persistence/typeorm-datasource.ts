import { NestFactory } from '@nestjs/core';
import { ContentConfig, contentConfigFactory } from '@tlc/content/config';
import { dataSourceOptionsFactory } from '@tlc/content/persistence/typeorm-datasource.factory';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
config();

const getDataSource = async () => {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      load: [contentConfigFactory],
    })
  );
  const configService = configModule.get<ConfigService<ContentConfig>>(ConfigService);
  return new DataSource(dataSourceOptionsFactory(configService));
};

export default getDataSource();
