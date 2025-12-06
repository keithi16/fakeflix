import { Injectable } from '@nestjs/common';
import { Content } from '../../../../shared/persistence/entity/content.entity';

@Injectable()
export class ListContentUseCase {
  async execute(): Promise<Content[]> {
    return [];
  }
}
