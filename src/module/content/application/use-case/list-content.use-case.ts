import { Injectable } from '@nestjs/common';
import { Content } from '@src/module/content/persistence/entity/content.entity';

@Injectable()
export class ListContentUseCase {
  async execute(): Promise<Content[]> {
    return [];
  }
}
