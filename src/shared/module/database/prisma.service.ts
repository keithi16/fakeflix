import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  private logger = new Logger(PrismaService.name);

  constructor(@Inject(ConfigService) configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
    });
  }

  async onModuleInit() {
    this.logger.log({
      message: 'Connecting to Prisma on database module initialization',
    });

    await this.$connect();
  }

  // In Prisma v5, the `beforeExit` is no longer available. Instead, we use
  // NestJS' application shutdown to disconnect from the database. The shutdown
  // hooks are called when the process receives a termination event lig SIGhooks
  // are called when the process receives a termination event lig SIGTERM.
  //
  // See also https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-5#removal-of-the-beforeexit-hook-from-the-library-engine
  onApplicationShutdown(signal: string) {
    this.logger.log({
      message: 'Disconnecting from Prisma on application shutdown',
      signal,
    });

    // The $disconnect method returns a promise, so idealy we should wait for it
    // to finish. However, the onApplicationShutdown, returns `void` making it
    // impossible to ensure the database will be properly disconnected before
    // the shutdown.
    this.$disconnect();
  }
}
