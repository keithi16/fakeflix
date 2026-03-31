import { Injectable, NotFoundException } from '@nestjs/common';
import { Content } from '../../../shared/core';
import { ContentRepository } from '../../persistence/repository/content.repository';

@Injectable()
export class GetAdminContentUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(contentId: string): Promise<Content> {
    const content = await this.contentRepository.findContentByIdWithRelations(contentId);
    if (!content) {
      throw new NotFoundException(`Content with id "${contentId}" not found`);
    }
    return content;
  }
}
