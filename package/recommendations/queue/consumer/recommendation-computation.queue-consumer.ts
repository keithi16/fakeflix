import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Job, Queue } from 'bullmq';
import { RecommendationComputationService } from '../../core/service/recommendation-computation.service';
import { RECOMMENDATION_QUEUES } from '../queue-constants';

@Processor(RECOMMENDATION_QUEUES.RECOMMENDATION_COMPUTATION, { concurrency: 1 })
export class RecommendationComputationQueueConsumer extends WorkerHost implements OnModuleInit {
  constructor(
    @InjectQueue(RECOMMENDATION_QUEUES.RECOMMENDATION_COMPUTATION) private readonly queue: Queue,
    private readonly recommendationComputationService: RecommendationComputationService,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      'process',
      {},
      { repeat: { every: 86400000 }, jobId: 'recommendation-computation-daily' },
    );
    this.logger.log('Recommendation computation repeatable job registered');
  }

  async process(_job: Job): Promise<void> {
    this.logger.log('Running recommendation computation for all users');
    await this.recommendationComputationService.recomputeAll();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Recommendation computation job ${job.id} failed: ${error.message}`, {
      jobData: job.data,
    });
  }
}
