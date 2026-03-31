import { PublishingStatus } from '../../../../../shared/core/enum/publishing-status.enum';
import { ContentTransition } from '../../../../../shared/persistence/entity/content-transition.entity';

export class ContentTransitionResponseDto {
  id: string;
  previousState: PublishingStatus;
  newState: PublishingStatus;
  triggeredBy: string;
  reason: string | null;
  transitionedAt: Date;

  static from(transition: ContentTransition): ContentTransitionResponseDto {
    return {
      id: transition.id,
      previousState: transition.previousState,
      newState: transition.newState,
      triggeredBy: transition.triggeredBy,
      reason: transition.reason,
      transitionedAt: transition.transitionedAt,
    };
  }
}
