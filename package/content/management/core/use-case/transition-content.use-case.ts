import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import { Transactional } from 'typeorm-transactional';
import { Content } from '../../../shared/core';
import { PublishingStatus } from '../../../shared/core/enum/publishing-status.enum';
import { ContentTransition } from '../../../shared/persistence/entity/content-transition.entity';
import { ContentTransitionRepository } from '../../persistence/repository/content-transition.repository';
import { ContentRepository } from '../../persistence/repository/content.repository';
import { ScheduledPublishProducer } from '../../queue/producer/scheduled-publish.queue-producer';
import { ContentPublishingStateMachineService } from '../service/content-publishing-state-machine.service';
import { PublicationQualityGateService } from '../service/publication-quality-gate.service';

const MINIMUM_SCHEDULE_LEAD_MINUTES = 15;

@Injectable()
export class TransitionContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly contentTransitionRepository: ContentTransitionRepository,
    private readonly stateMachineService: ContentPublishingStateMachineService,
    private readonly qualityGateService: PublicationQualityGateService,
    private readonly scheduledPublishProducer: ScheduledPublishProducer,
    private readonly logger: AppLogger,
  ) {}

  @Transactional({ connectionName: 'content' })
  async execute(
    contentId: string,
    targetState: PublishingStatus,
    triggeredBy: string,
    reason?: string,
    scheduledPublishAt?: Date,
  ): Promise<Content> {
    const [movieContent, tvShowContent] = await Promise.all([
      this.contentRepository.findMovieContentById(contentId),
      this.contentRepository.findTvShowContentById(contentId, ['episodes']),
    ]);
    const content: Content | null = movieContent ?? tvShowContent;
    if (!content) {
      throw new NotFoundException(`Content with id "${contentId}" not found`);
    }

    const previousState = content.publishingStatus;

    this.stateMachineService.transition(content, targetState);

    if (targetState === PublishingStatus.PUBLISHED) {
      const gateResult = this.qualityGateService.validate(content);
      if (!gateResult.passed) {
        throw new UnprocessableEntityException({
          message: 'Content does not meet publication quality requirements',
          failures: gateResult.failures,
        });
      }
    }

    if (targetState === PublishingStatus.REVIEW && scheduledPublishAt) {
      const minimumPublishAt = new Date(Date.now() + MINIMUM_SCHEDULE_LEAD_MINUTES * 60 * 1000);
      if (scheduledPublishAt < minimumPublishAt) {
        throw new UnprocessableEntityException(
          `scheduledPublishAt must be at least ${MINIMUM_SCHEDULE_LEAD_MINUTES} minutes in the future`,
        );
      }
      content.scheduledPublishAt = scheduledPublishAt;
    }

    if (targetState === PublishingStatus.ARCHIVED) {
      content.archivedAt = new Date();
      content.archivedBy = triggeredBy;
    }

    if (previousState === PublishingStatus.ARCHIVED && targetState === PublishingStatus.PUBLISHED) {
      content.archivedAt = null;
      content.archivedBy = null;
    }

    const savedContent = await this.contentRepository.save(content);

    const transition = new ContentTransition({
      contentId,
      previousState,
      newState: targetState,
      triggeredBy,
      reason: reason ?? null,
    } as Partial<ContentTransition>);
    await this.contentTransitionRepository.save(transition);

    if (targetState === PublishingStatus.REVIEW && scheduledPublishAt) {
      await this.scheduledPublishProducer.schedulePublish(contentId, scheduledPublishAt);
      this.logger.log(`Scheduled publish enqueued for content ${contentId} at ${scheduledPublishAt.toISOString()}`);
    }

    return savedContent;
  }
}
