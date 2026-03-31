import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { UnprocessableEntityException } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Job } from 'bullmq';
import { PublishingStatus } from '../../../shared/core/enum/publishing-status.enum';
import { QUEUES } from '../../../shared/queue/queue-constants';
import { ContentRepository } from '../../persistence/repository/content.repository';
import { TransitionContentUseCase } from '../../core/use-case/transition-content.use-case';
import { ScheduledPublishJobPayload } from '../../../shared/contract/scheduled-publish.contract';

@Processor(QUEUES.CONTENT_SCHEDULED_PUBLISH)
export class ScheduledPublishConsumer extends WorkerHost {
  constructor(
    private readonly transitionContentUseCase: TransitionContentUseCase,
    private readonly contentRepository: ContentRepository,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async process(job: Job<ScheduledPublishJobPayload, void>): Promise<void> {
    const { contentId } = job.data;

    this.logger.log(`Processing scheduled publish for content ${contentId}`);

    const content =
      (await this.contentRepository.findMovieContentById(contentId)) ??
      (await this.contentRepository.findTvShowContentById(contentId));

    if (!content) {
      this.logger.log(`Content ${contentId} not found — skipping scheduled publish`);
      return;
    }

    if (content.publishingStatus !== PublishingStatus.REVIEW) {
      this.logger.log(
        `Content ${contentId} is in state ${content.publishingStatus} (expected REVIEW) — skipping scheduled publish`,
      );
      return;
    }

    try {
      await this.transitionContentUseCase.execute(contentId, PublishingStatus.PUBLISHED, 'SYSTEM');
      this.logger.log(`Scheduled publish succeeded for content ${contentId}`);
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        this.logger.error(`Scheduled publish failed quality gates for content ${contentId}`, { error, contentId });
        content.schedulingOutcome = 'FAILED_VALIDATION';
        await this.contentRepository.save(content);
        this.logger.log(`Marked content ${contentId} scheduling outcome as FAILED_VALIDATION`);
      } else {
        throw error;
      }
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Scheduled publish job failed: ${job.id}`, { job, error });
  }
}
