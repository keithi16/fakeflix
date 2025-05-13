import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MonolithApiConfig } from './config';
import { MonolithModule } from './monolith.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { LoggerFactory } from '@tlc/shared-module/logger/util/logger.factory';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  const logger = LoggerFactory('monolith-api');
  initializeTransactionalContext();
  const app = await NestFactory.create(MonolithModule, { bufferLogs: true });
  const configService = app.get<ConfigService<MonolithApiConfig>>(ConfigService);
  const port = configService.get('monolithApi.port');

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useLogger(logger);

  await app.listen(port);

  logger.log({ message: `Monolithic Application running on port ${port}` });
}

bootstrap();
