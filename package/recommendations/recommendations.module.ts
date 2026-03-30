import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '@tlc/shared-module/auth';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AnalyticsModule } from '@tlc/analytics';
import { ContentModule } from '@tlc/content';
import { Config } from './config';
import { ContinueWatchingService } from './core/service/continue-watching.service';
import { PersonalizedRecommendationService } from './core/service/personalized-recommendation.service';
import { RecommendationComputationService } from './core/service/recommendation-computation.service';
import { RecommendationsController } from './http/rest/controller/recommendations.controller';
import { RecommendationsPersistenceModule } from './persistence/recommendations-persistence.module';
import { RecommendationComputationQueueConsumer } from './queue/consumer/recommendation-computation.queue-consumer';
import { RECOMMENDATION_QUEUES } from './queue/queue-constants';

@Module({
  imports: [
    AuthModule,
    LoggerModule,
    RecommendationsPersistenceModule,
    AnalyticsModule,
    ContentModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Config>) => ({
        connection: {
          host: configService.get('recommendations.redis.host'),
          port: configService.get('recommendations.redis.port'),
          password: configService.get('recommendations.redis.password'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: RECOMMENDATION_QUEUES.RECOMMENDATION_COMPUTATION }),
  ],
  providers: [
    RecommendationComputationService,
    ContinueWatchingService,
    PersonalizedRecommendationService,
    RecommendationComputationQueueConsumer,
  ],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}

export { factory as recommendationsConfigFactory } from './config';
