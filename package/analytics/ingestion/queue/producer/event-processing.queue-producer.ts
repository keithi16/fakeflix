import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Queue } from 'bullmq';
import { ANALYTICS_QUEUES } from '../../../shared/queue/queue-constants';
import { AnalyticsEventProcessingJobData } from '../../../shared/contract/event-processing-job.contract';

@Injectable()
export class EventProcessingProducer {
  constructor(
    @InjectQueue(ANALYTICS_QUEUES.EVENT_PROCESSING) private readonly queue: Queue,
    private readonly logger: AppLogger
  ) {}

  async enqueueEventProcessing(
    payload: AnalyticsEventProcessingJobData
  ): Promise<string> {
    this.logger.log(
      `Queueing event processing job for userId: ${payload.userId}, event: ${payload.eventType}`
    );
    const job = await this.queue.add('process', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.log(`Event processing job created with ID: ${job.id}`);
    return job.id as string;
  }
}
