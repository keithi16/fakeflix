import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { AppLogger } from '@tlc/shared-module/logger';
import { Job } from 'bullmq';
import { AnalyticsContentType } from '../../../shared/enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../../shared/enum/analytics-event-type.enum';
import { AnalyticsEventProcessingJobData } from '../../../shared/contract/event-processing-job.contract';
import { ANALYTICS_QUEUES } from '../../../shared/queue/queue-constants';
import { ContentPerformanceAggregationService } from '../../core/service/content-performance-aggregation.service';
import { WatchHistoryAggregationService } from '../../core/service/watch-history-aggregation.service';
import { BingeDetectionService } from '../../core/service/binge-detection.service';

@Processor(ANALYTICS_QUEUES.EVENT_PROCESSING)
export class EventAggregationConsumer extends WorkerHost {
  constructor(
    private readonly watchHistoryAggregationService: WatchHistoryAggregationService,
    private readonly contentPerformanceAggregationService: ContentPerformanceAggregationService,
    private readonly bingeDetectionService: BingeDetectionService,
    private readonly logger: AppLogger
  ) {
    super();
  }

  async process(job: Job<AnalyticsEventProcessingJobData>): Promise<void> {
    const event = job.data;
    this.logger.log(`Processing aggregation job ${job.id} for event ${event.eventType}`);

    await Promise.all([
      this.watchHistoryAggregationService.processEvent(event),
      this.contentPerformanceAggregationService.processEvent(event),
    ]);

    if (
      event.eventType === AnalyticsEventType.COMPLETE &&
      event.contentType === AnalyticsContentType.TV_EPISODE
    ) {
      try {
        await this.bingeDetectionService.evaluateBinge(
          event.userId,
          event.contentId,
          event.occurredAt
        );
      } catch (error) {
        this.logger.error(`Binge detection failed: ${error}`);
      }
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Aggregation job ${job.id} failed: ${error.message}`,
      { jobData: job.data }
    );
  }
}
