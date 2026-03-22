import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Job, Queue } from 'bullmq';
import { ANALYTICS_QUEUES } from '../../../shared/queue/queue-constants';
import { GenreAffinityService } from '../../core/service/genre-affinity.service';

@Processor(ANALYTICS_QUEUES.GENRE_AFFINITY_RECOMPUTATION, { concurrency: 1 })
export class GenreAffinityRecomputationConsumer extends WorkerHost implements OnModuleInit {
  constructor(
    @InjectQueue(ANALYTICS_QUEUES.GENRE_AFFINITY_RECOMPUTATION) private readonly queue: Queue,
    private readonly genreAffinityService: GenreAffinityService,
    private readonly logger: AppLogger
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      'process',
      {},
      {
        repeat: { every: 21600000 },
        jobId: 'genre-affinity-recompute',
      }
    );
    this.logger.log('Genre affinity recomputation repeatable job registered');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async process(_job: Job): Promise<void> {
    this.logger.log('Running genre affinity recomputation');
    await this.genreAffinityService.recomputeAll();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Genre affinity job ${job.id} failed: ${error.message}`,
      { jobData: job.data }
    );
  }
}
