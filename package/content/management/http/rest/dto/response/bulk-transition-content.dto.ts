import { PublishingStatus } from '../../../../../shared/core/enum/publishing-status.enum';

export class BulkTransitionSuccessItemDto {
  id: string;
  newState: PublishingStatus;
}

export class BulkTransitionFailureItemDto {
  id: string;
  reason: string;
}

export class BulkTransitionResponseDto {
  succeeded: BulkTransitionSuccessItemDto[];
  failed: BulkTransitionFailureItemDto[];
}
