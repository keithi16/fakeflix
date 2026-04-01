import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PublishingStatus } from '../../../shared/core/enum/publishing-status.enum';
import { TransitionContentUseCase } from './transition-content.use-case';

export interface BulkTransitionResult {
  succeeded: { id: string; newState: PublishingStatus }[];
  failed: { id: string; reason: string }[];
}

@Injectable()
export class BulkTransitionContentUseCase {
  constructor(private readonly transitionContentUseCase: TransitionContentUseCase) {}

  async execute(contentIds: string[], targetState: PublishingStatus, triggeredBy: string): Promise<BulkTransitionResult> {
    const succeeded: BulkTransitionResult['succeeded'] = [];
    const failed: BulkTransitionResult['failed'] = [];

    const seen = new Set<string>();
    const unique: string[] = [];
    const duplicates: string[] = [];

    for (const id of contentIds) {
      if (seen.has(id)) {
        duplicates.push(id);
      } else {
        seen.add(id);
        unique.push(id);
      }
    }

    const results = await Promise.allSettled(
      unique.map(id => this.transitionContentUseCase.execute(id, targetState, triggeredBy).then(content => ({ id, content }))),
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const id = unique[i];
      if (result.status === 'fulfilled') {
        succeeded.push({ id, newState: result.value.content.publishingStatus });
      } else {
        const error = result.reason;
        const isDomainError = error instanceof NotFoundException || error instanceof UnprocessableEntityException;
        const reason = isDomainError ? (error as Error).message : 'Transition failed — please retry';
        failed.push({ id, reason });
      }
    }

    for (const id of duplicates) {
      failed.push({ id, reason: 'Duplicate contentId in request' });
    }

    return { succeeded, failed };
  }
}
