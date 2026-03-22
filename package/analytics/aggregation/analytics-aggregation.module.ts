import { Module } from '@nestjs/common';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AnalyticsSharedModule } from '../shared/analytics-shared.module';
import { AggregationQueryService } from './core/service/aggregation-query.service';
import { BingeDetectionService } from './core/service/binge-detection.service';
import { ContentPerformanceAggregationService } from './core/service/content-performance-aggregation.service';
import { GenreAffinityService } from './core/service/genre-affinity.service';
import { TrendingComputationService } from './core/service/trending-computation.service';
import { WatchHistoryAggregationService } from './core/service/watch-history-aggregation.service';
import { AggregationFacade } from './public-api/facade/aggregation.facade';
import { EventAggregationConsumer } from './queue/consumer/event-aggregation.queue-consumer';
import { GenreAffinityRecomputationConsumer } from './queue/consumer/genre-affinity-recomputation.queue-consumer';
import { TrendingComputationConsumer } from './queue/consumer/trending-computation.queue-consumer';

@Module({
  imports: [AnalyticsSharedModule, LoggerModule],
  providers: [
    WatchHistoryAggregationService,
    ContentPerformanceAggregationService,
    EventAggregationConsumer,
    TrendingComputationService,
    TrendingComputationConsumer,
    BingeDetectionService,
    GenreAffinityService,
    GenreAffinityRecomputationConsumer,
    AggregationQueryService,
    AggregationFacade,
  ],
  exports: [AggregationFacade],
})
export class AnalyticsAggregationModule {}
