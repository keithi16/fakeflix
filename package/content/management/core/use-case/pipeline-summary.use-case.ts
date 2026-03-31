import { Injectable } from '@nestjs/common';
import { ContentType } from '../../../shared/core/enum/content-type.enum';
import { PublishingStatus } from '../../../shared/core/enum/publishing-status.enum';
import { ContentRepository } from '../../persistence/repository/content.repository';

export interface PipelineStatusCounts {
  draft: number;
  review: number;
  published: number;
  archived: number;
}

export interface PipelineSummary extends PipelineStatusCounts {
  breakdown?: Record<ContentType, PipelineStatusCounts>;
}

function buildEmptyCounts(): PipelineStatusCounts {
  return { draft: 0, review: 0, published: 0, archived: 0 };
}

function statusKey(status: PublishingStatus): keyof PipelineStatusCounts {
  const map: Record<PublishingStatus, keyof PipelineStatusCounts> = {
    [PublishingStatus.DRAFT]: 'draft',
    [PublishingStatus.REVIEW]: 'review',
    [PublishingStatus.PUBLISHED]: 'published',
    [PublishingStatus.ARCHIVED]: 'archived',
  };
  return map[status];
}

@Injectable()
export class PipelineSummaryUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(breakdown?: 'contentType'): Promise<PipelineSummary> {
    if (breakdown === 'contentType') {
      const rows = await this.contentRepository.countByPublishingStatusAndContentType();
      const totals = buildEmptyCounts();
      const byType = {} as Record<ContentType, PipelineStatusCounts>;

      for (const row of rows) {
        const key = statusKey(row.publishingStatus);
        const count = parseInt(row.count, 10);

        totals[key] += count;

        if (!byType[row.type]) {
          byType[row.type] = buildEmptyCounts();
        }
        byType[row.type][key] += count;
      }

      return { ...totals, breakdown: byType };
    }

    const rows = await this.contentRepository.countByPublishingStatus();
    const totals = buildEmptyCounts();

    for (const row of rows) {
      const key = statusKey(row.publishingStatus);
      totals[key] = parseInt(row.count, 10);
    }

    return totals;
  }
}
