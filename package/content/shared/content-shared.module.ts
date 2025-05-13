import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ContentConfig } from '../config';
import { ContentSharedPersistenceModule } from './persistence/persistence.module';
import { QUEUES } from './queue/queue-constants';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<ContentConfig>) => ({
        connection: {
          host: configService.get('content.redis.host'),
          port: configService.get('content.redis.port'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUES.VIDEO_AGE_RECOMMENDATION,
      },
      {
        name: QUEUES.VIDEO_SUMMARY,
      },
      {
        name: QUEUES.VIDEO_TRANSCRIPT,
      },
      {
        name: QUEUES.CONTENT_AGE_RECOMMENDATION,
      }
    ),
    ContentSharedPersistenceModule,
  ],
  exports: [ContentSharedPersistenceModule, BullModule],
})
export class ContentSharedModule {}
