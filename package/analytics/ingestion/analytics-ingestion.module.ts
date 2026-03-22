import { Module } from '@nestjs/common';
import { LoggerModule } from '@tlc/shared-module/logger';
import { AnalyticsSharedModule } from '../shared/analytics-shared.module';
import { EventIngestionService } from './core/service/event-ingestion.service';
import { PlayerEventController } from './http/rest/controller/player-event.controller';
import { EventProcessingProducer } from './queue/producer/event-processing.queue-producer';

@Module({
  imports: [AnalyticsSharedModule, LoggerModule],
  providers: [EventIngestionService, EventProcessingProducer],
  controllers: [PlayerEventController],
})
export class AnalyticsIngestionModule {}
