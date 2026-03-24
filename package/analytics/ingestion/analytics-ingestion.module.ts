import { Module } from '@nestjs/common';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AnalyticsSharedModule } from '../shared/analytics-shared.module';
import { EventIngestionService } from './core/service/event-ingestion.service';
import { PlayerEventController } from './http/rest/controller/player-event.controller';
import { HeartbeatRepository } from './persistence/repository/heartbeat.repository';
import { ViewEventRepository } from './persistence/repository/view-event.repository';
import { IngestionReadFacade } from './public-api/facade/ingestion-read.facade';
import { EventProcessingProducer } from './queue/producer/event-processing.queue-producer';

@Module({
  imports: [AnalyticsSharedModule, LoggerModule],
  providers: [EventIngestionService, EventProcessingProducer, ViewEventRepository, HeartbeatRepository, IngestionReadFacade],
  controllers: [PlayerEventController],
  exports: [IngestionReadFacade],
})
export class AnalyticsIngestionModule {}
