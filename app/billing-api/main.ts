import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BillingApiModule } from './billing-api.module';
import { BillingApiConfig } from './config';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { LoggerFactory } from '@tlc/shared-module/logger/util/logger.factory';

async function bootstrap() {
  const logger = LoggerFactory('billing-api');
  const app = await NestFactory.create(BillingApiModule, { bufferLogs: true });
  const configService = app.get<ConfigService<BillingApiConfig>>(ConfigService);
  const port = configService.get('billingApi.port');

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useLogger(logger);

  await app.listen(port);

  logger.log({ message: `Billing API running on port ${port}` });
}

bootstrap();
