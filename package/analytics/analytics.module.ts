import { Module } from '@nestjs/common';
import { AuthModule } from '@tlc/shared-module/auth';
import { ConfigModule } from '@tlc/shared-module/config';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AnalyticsApi } from '@tlc/shared-module/public-api';
import { AnalyticsAggregationModule } from './aggregation/analytics-aggregation.module';
import { AnalyticsIngestionModule } from './ingestion/analytics-ingestion.module';
import { AnalyticsFacade } from './public-api/facade/analytics.facade';
import { AnalyticsReportingModule } from './reporting/analytics-reporting.module';
import { AnalyticsSharedModule } from './shared/analytics-shared.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    LoggerModule,
    AnalyticsSharedModule,
    AnalyticsIngestionModule,
    AnalyticsAggregationModule,
    AnalyticsReportingModule,
  ],
  providers: [
    AnalyticsFacade,
    { provide: AnalyticsApi, useClass: AnalyticsFacade },
  ],
  exports: [AnalyticsApi],
})
export class AnalyticsModule {}

export { factory as analyticsConfigFactory } from './config';
