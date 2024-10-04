import { Injectable } from '@nestjs/common';
import { ContentMedia } from '@src/module/content/persistence/entity/content-media.entity';
import { ContentMediaRepository } from '@src/module/content/persistence/repository/content-media.repository';

@Injectable()
export class ContentIndexingService {
  constructor(private readonly contentMediaRepository: ContentMediaRepository) {}
  async indexContent(content: ContentMedia) {
    await this.contentMediaRepository.save(content);
  }
}
