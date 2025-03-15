import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MonolithModule } from '@tlc/app/monolith/monolith.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { LoggerFactory } from '@tlc/shared-module/logger/util/logger.factory';

async function bootstrap() {
  const logger = LoggerFactory('appplication-main');
  const app = await NestFactory.create(MonolithModule);
  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get('monolith.port');

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useLogger(logger);

  await app.listen(port);

  logger.log({ message: `Monolithic Application running on port ${port}` });
}

bootstrap();
