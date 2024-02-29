import { Injectable } from '@nestjs/common';
import { ContentMedia } from '@src/module/content/content-streaming/persistence/entity/content-media.entity';
import { ContentRepository } from '@src/module/content/content-streaming/persistence/repository/content.repository';

@Injectable()
export class ContentIndexingService {
  constructor(private readonly contentRepository: ContentRepository) {}
  async indexContent(content: ContentMedia) {
    await this.contentRepository.save(content);
  }
}
