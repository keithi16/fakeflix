import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { AnalyticsConfig } from '../config';
import { ANALYTICS_QUEUES } from './queue/queue-constants';
import { AnalyticsSharedPersistenceModule } from './persistence/analytics-persistence.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AnalyticsConfig>) => ({
        connection: {
          host: configService.get('analytics.redis.host'),
          port: configService.get('analytics.redis.port'),
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
      { name: ANALYTICS_QUEUES.EVENT_PROCESSING },
      { name: ANALYTICS_QUEUES.GENRE_AFFINITY_RECOMPUTATION },
      { name: ANALYTICS_QUEUES.TRENDING_COMPUTATION }
    ),
    AnalyticsSharedPersistenceModule,
  ],
  exports: [AnalyticsSharedPersistenceModule, BullModule],
})
export class AnalyticsSharedModule {}
