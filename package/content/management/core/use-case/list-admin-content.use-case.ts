import { Injectable } from '@nestjs/common';
import { Content } from '../../../shared/core';
import { PublishingStatus } from '../../../shared/core/enum/publishing-status.enum';
import { ContentRepository } from '../../persistence/repository/content.repository';

@Injectable()
export class ListAdminContentUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(statuses?: PublishingStatus[], scheduledOnly?: boolean): Promise<Content[]> {
    return this.contentRepository.findAllWithOptionalStatusFilter(statuses, scheduledOnly);
  }
}
