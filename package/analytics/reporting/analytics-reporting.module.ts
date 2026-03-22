import { Module } from '@nestjs/common';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AnalyticsSharedModule } from '../shared/analytics-shared.module';
import { CsvExportService } from './core/service/csv-export.service';
import { ReportingService } from './core/service/reporting.service';
import { AdminAnalyticsController } from './http/rest/controller/admin-analytics.controller';

@Module({
  imports: [AnalyticsSharedModule, LoggerModule],
  providers: [ReportingService, CsvExportService],
  controllers: [AdminAnalyticsController],
})
export class AnalyticsReportingModule {}
