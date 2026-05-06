import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Content } from '../../../shared/core';
import { PublishingStatus } from '../../../shared/core/enum/publishing-status.enum';

@Injectable()
export class ContentPublishingStateMachineService {
  private readonly ALLOWED_TRANSITIONS: Map<PublishingStatus, PublishingStatus[]> = new Map([
    [PublishingStatus.DRAFT, [PublishingStatus.REVIEW]],
    [PublishingStatus.REVIEW, [PublishingStatus.PUBLISHED, PublishingStatus.DRAFT, PublishingStatus.REJECTED]],
    [PublishingStatus.PUBLISHED, [PublishingStatus.ARCHIVED]],
    [PublishingStatus.ARCHIVED, [PublishingStatus.PUBLISHED]],
    [PublishingStatus.REJECTED, [PublishingStatus.DRAFT]],
  ]);

  transition(content: Content, targetState: PublishingStatus): void {
    const allowed = this.ALLOWED_TRANSITIONS.get(content.publishingStatus) ?? [];
    if (!allowed.includes(targetState)) {
      const allowedList = allowed.join(', ') || 'none';
      throw new UnprocessableEntityException(
        `Invalid publishing state transition from "${content.publishingStatus}" to "${targetState}". Allowed transitions: [${allowedList}]`,
      );
    }
    content.publishingStatus = targetState;
  }

  getAllowedTransitions(currentState: PublishingStatus): PublishingStatus[] {
    return this.ALLOWED_TRANSITIONS.get(currentState) ?? [];
  }
}
