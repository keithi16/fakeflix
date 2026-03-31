import { Injectable } from '@nestjs/common';
import { ContentTransition } from '../../../shared/persistence/entity/content-transition.entity';
import { ContentTransitionRepository } from '../../persistence/repository/content-transition.repository';

@Injectable()
export class ListRecentTransitionsUseCase {
  constructor(private readonly contentTransitionRepository: ContentTransitionRepository) {}

  async execute(limit = 50): Promise<ContentTransition[]> {
    return this.contentTransitionRepository.findRecentTransitions(limit);
  }
}
