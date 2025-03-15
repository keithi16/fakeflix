import { Injectable } from '@nestjs/common';
import { Content } from '@tlc/content/persistence/entity/content.entity';

@Injectable()
export class ListContentUseCase {
  async execute(): Promise<Content[]> {
    return [];
  }
}
