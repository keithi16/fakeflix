import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Job, Queue } from 'bullmq';
import { AnalyticsTrendingWindowType } from '../../../shared/enum/analytics-trending-window-type.enum';
import { ANALYTICS_QUEUES } from '../../../shared/queue/queue-constants';
import { TrendingComputationService } from '../../core/service/trending-computation.service';

@Processor(ANALYTICS_QUEUES.TRENDING_COMPUTATION, { concurrency: 1 })
export class TrendingComputationConsumer extends WorkerHost implements OnModuleInit {
  constructor(
    @InjectQueue(ANALYTICS_QUEUES.TRENDING_COMPUTATION) private readonly queue: Queue,
    private readonly trendingComputationService: TrendingComputationService,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      'process',
      { windowType: AnalyticsTrendingWindowType.DAILY },
      { repeat: { every: 3600000 }, jobId: 'trending-daily' },
    );
    await this.queue.add(
      'process',
      { windowType: AnalyticsTrendingWindowType.WEEKLY },
      { repeat: { every: 21600000 }, jobId: 'trending-weekly' },
    );
    this.logger.log('Trending computation repeatable jobs registered');
  }

  async process(job: Job<{ windowType: AnalyticsTrendingWindowType }>): Promise<void> {
    this.logger.log(`Running trending computation for window: ${job.data.windowType}`);
    await this.trendingComputationService.computeWindow(job.data.windowType);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Trending computation job ${job.id} failed: ${error.message}`, {
      jobData: job.data,
    });
  }
}
