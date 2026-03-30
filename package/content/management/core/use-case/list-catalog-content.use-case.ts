import { Injectable } from '@nestjs/common';
import { ContentCatalogItem } from '@tlc/shared-module/public-api';
import { ContentRepository } from '../../persistence/repository/content.repository';

@Injectable()
export class ListCatalogContentUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(): Promise<ContentCatalogItem[]> {
    const items = await this.contentRepository.find({});
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      genres: item.genres,
      releaseDate: item.releaseDate,
    }));
  }
}
