import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentTransition } from '../../../shared/persistence/entity/content-transition.entity';
import { ContentTransitionRepository } from '../../persistence/repository/content-transition.repository';
import { ContentRepository } from '../../persistence/repository/content.repository';

@Injectable()
export class ListContentTransitionsUseCase {
  constructor(
    private readonly contentTransitionRepository: ContentTransitionRepository,
    private readonly contentRepository: ContentRepository,
  ) {}

  async execute(contentId: string): Promise<ContentTransition[]> {
    const [movieContent, tvShowContent] = await Promise.all([
      this.contentRepository.findMovieContentById(contentId),
      this.contentRepository.findTvShowContentById(contentId),
    ]);

    if (!movieContent && !tvShowContent) {
      throw new NotFoundException(`Content with id "${contentId}" not found`);
    }

    return this.contentTransitionRepository.findByContentId(contentId);
  }
}
