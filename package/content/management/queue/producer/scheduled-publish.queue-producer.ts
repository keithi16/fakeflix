import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Queue } from 'bullmq';
import { ScheduledPublishJobPayload } from '../../../shared/contract/scheduled-publish.contract';
import { QUEUES } from '../../../shared/queue/queue-constants';

@Injectable()
export class ScheduledPublishProducer {
  constructor(
    @InjectQueue(QUEUES.CONTENT_SCHEDULED_PUBLISH)
    private readonly scheduledPublishQueue: Queue<ScheduledPublishJobPayload>,
    private readonly logger: AppLogger,
  ) {}

  async schedulePublish(contentId: string, publishAt: Date): Promise<void> {
    const delay = publishAt.getTime() - Date.now();

    this.logger.log(`Scheduling content ${contentId} for publish at ${publishAt.toISOString()} (delay: ${delay}ms)`);

    await this.scheduledPublishQueue.add(
      'scheduled-publish',
      { contentId },
      {
        jobId: contentId,
        delay,
      },
    );

    this.logger.log(`Scheduled publish job enqueued for content ${contentId}`);
  }

  async cancelSchedule(contentId: string): Promise<void> {
    const job = await this.scheduledPublishQueue.getJob(contentId);

    if (!job) {
      throw new UnprocessableEntityException('no active schedule');
    }

    await job.remove();

    this.logger.log(`Scheduled publish job cancelled for content ${contentId}`);
  }
}
