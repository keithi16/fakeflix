import { Injectable } from '@nestjs/common';
import { Content } from '@tlc/content/shared/persistence/entity/content.entity';

@Injectable()
export class ListContentUseCase {
  async execute(): Promise<Content[]> {
    return [];
  }
}
