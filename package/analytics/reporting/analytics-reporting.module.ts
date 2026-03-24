import { Module } from '@nestjs/common';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AnalyticsAggregationModule } from '../aggregation/analytics-aggregation.module';
import { AnalyticsSharedModule } from '../shared/analytics-shared.module';
import { CsvExportService } from './core/service/csv-export.service';
import { ReportingService } from './core/service/reporting.service';
import { AdminAnalyticsController } from './http/rest/controller/admin-analytics.controller';

@Module({
  imports: [AnalyticsSharedModule, AnalyticsAggregationModule, LoggerModule],
  providers: [ReportingService, CsvExportService],
  controllers: [AdminAnalyticsController],
})
export class AnalyticsReportingModule {}
